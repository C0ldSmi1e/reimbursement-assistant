import { useEffect, useState } from "react";
import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import useImageUpload from "~/hooks/useImageUpload";
import ImagePreview from "~/components/ImagePreview";
import ImageUploader from "~/components/ImageUploader";
import useGemini from "~/hooks/useGemini";
import { google } from 'googleapis';
import ImageResult from "~/components/ImageResult";
import { getGoogleAuthUrl } from "~/utils/googleAuth.server";
import { craftFilename, findOrCreateFolder } from "~/utils/googleDrive.server";
import { destroySession, getSession } from "~/utils/session.server";
import { Readable } from 'stream';
import InfoBar from "~/components/InfoBar";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    // If no user in session, return the Google auth URL
    const googleAuthUrl = getGoogleAuthUrl();
    return json({ isLoggedIn: false, googleAuthUrl, GEMINI_API_KEY: process.env.GEMINI_API_KEY });
  }

  return json({ isLoggedIn: true, user, GEMINI_API_KEY: process.env.GEMINI_API_KEY });

};

export const meta: MetaFunction = () => {
  return [
    { title: "Reimbursement Assistant" },
    { name: "description", content: "Reimbursement Assistant" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const code = formData.get("code");
  const logout = formData.get("logout");
  const upload = formData.get("upload");
  const base64 = formData.get("base64") as string;
  const mimeType = formData.get("mimeType") as string;
  const message = formData.get("message") as string;
  const date = formData.get("date") as string;
  const item = formData.get("item") as string;
  const amount = formData.get("amount") as string;

  if (code) {
    return redirect(`/auth/google/callback?code=${code}`);
  }

  if (logout === "true") {
    const session = await getSession(request.headers.get("Cookie"));
    return redirect("/", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  if (upload === "true") {
    if (!base64 || !mimeType || !message || message.includes("error")) {
      return json({ success: false });
    }

    const filename = craftFilename({ date, item, amount, mimeType });

    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
      return json({ success: false });
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      const driveClient = google.drive({ version: 'v3', auth: oauth2Client });

      const dateObj = new Date(date);
      const folderName = `reimbursement-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
      const folderId = await findOrCreateFolder(driveClient, folderName);
      if (!folderId) {
        return json({ success: false, error: "Failed to find or create folder" });
      }

      const fileMetadata = {
        name: filename,
        mimeType: mimeType,
        parents: [folderId],
      };

      // Convert base64 to buffer
      const buffer = Buffer.from(base64.split(',')[1], 'base64');

      // Create a readable stream from the buffer
      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);

      const media = {
        mimeType: mimeType,
        body: readable,
      };

      const response = await driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      console.log('File uploaded successfully. File ID:', response.data.id);
      return json({ success: true, fileId: response.data.id });
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return json({ success: false, error: "Failed to upload file" });
    }
  }

  return json({ success: true });
};


const Index = () => {
  const { isLoggedIn, user, googleAuthUrl, GEMINI_API_KEY } = useLoaderData<{
    isLoggedIn: boolean;
    user?: {
      email: string;
      name: string;
      accessToken: string;
      refreshToken: string;
    };
    googleAuthUrl?: string;
    GEMINI_API_KEY: string;
  }>();
  const submit = useSubmit();
  const { uploadImage, imageData } = useImageUpload();
  const { onAnalyzeImage, imageInfo, isScanning } = useGemini(GEMINI_API_KEY);
  const [isSaving, setIsSaving] = useState(false);
  const actionData = useActionData<{ success: boolean; error?: string }>();

  useEffect(() => {
    // Handle Google OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      submit({ code }, { method: "post" });
    }
  }, [submit]);

  useEffect(() => { 
    if (actionData) {
      setIsSaving(false);
      if (actionData.success) {
        alert("File saved successfully!");
      } else {
        alert(`Error saving file: ${actionData.error || "Unknown error"}`);
      }
    }
  }, [actionData]);

  const onSubmit = async () => {
    if (!imageData) {
      alert("Please upload an image first");
      return;
    }

    await onAnalyzeImage(imageData);
  }

  const onSave = async () => {
    if (!imageData || !imageInfo || !imageInfo.message || imageInfo.message === "error") {
      alert("Please upload an image first and scan it");
      return;
    }

    if (!imageInfo.date || !imageInfo.item || !imageInfo.amount) {
      alert("Please set date, item, and amount first");
      return;
    }

    try {
      setIsSaving(true);
      submit({
        upload: "true",
        base64: imageData.base64 as string,
        mimeType: imageData.mimeType as string,
        message: imageInfo.message as string,
        date: imageInfo.date as string,
        item: imageInfo.item as string,
        amount: imageInfo.amount as string
      }, { method: "post" });
    } catch (error) {
      alert("Error saving file");
      setIsSaving(false);
    }
  }

  const onLogout = async () => {
    submit({ logout: "true" }, { method: "post" });
  };
  
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <a href={googleAuthUrl} className="border-2 border-black rounded-md px-4 py-2">
          Login with Google
        </a>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl flex flex-col items-center justify-around gap-4 p-4">
        <InfoBar name={user?.name} email={user?.email} onLogout={onLogout} />
        <div className="w-full flex flex-col md:flex-row items-start justify-around gap-12">
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center gap-4">
            <ImageUploader onUpload={uploadImage} />
            <ImagePreview imageData={imageData} />
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-start justify-center gap-8">
            <div className="flex gap-4 items-center">
              <p className="font-bold">
                👉🏻 Step 2:
              </p>
              <button
                className="border-2 border-black rounded-md px-4 py-2"
                onClick={onSubmit}
                disabled={isScanning}
              >
                {isScanning ? "Scanning..." : "Scan Image"}
              </button>
            </div>
            <ImageResult imageInfo={imageInfo} />
            <div className="flex gap-4 items-center">
              <p className="font-bold">
                👉🏻 Step 3:
              </p>
              <button 
                className="border-2 border-black rounded-md px-4 py-2" 
                onClick={onSave} 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save to Drive"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;