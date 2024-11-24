import { useEffect, useState } from "react";
import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useFetcher } from "@remix-run/react";
import useImageUpload from "~/hooks/useImageUpload";
import ImagePreview from "~/components/ImagePreview";
import ImageUploader from "~/components/ImageUploader";
import useGemini from "~/hooks/useGemini";
import { google } from "googleapis";
import ImageResult from "~/components/ImageResult";
import { getGoogleAuthUrl, getValidAccessToken } from "~/utils/googleAuth.server";
import {
  checkSheet,
  craftFilename,
  findOrCreateFolder,
  findOrCreateSheet,
  appendNewItemToSheet
} from "~/utils/googleDrive.server";
import { getSession } from "~/utils/session.server";
import { Readable } from "stream";
import InfoBar from "~/components/InfoBar";

const ACTIONS = {
  UPLOAD_IMAGE: "UPLOAD_IMAGE",
  UPDATE_SHEET: "UPDATE_SHEET",
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
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
  const action = formData.get("action");

  const uploadImage = formData.get("uploadImage");
  const updateSheet = formData.get("updateSheet");

  const page = formData.get("page") as string;
  const base64 = formData.get("base64") as string;
  const mimeType = formData.get("mimeType") as string;

  const message = formData.get("message") as string;
  const date = formData.get("date") as string;
  const item = formData.get("item") as string;
  const amount = formData.get("amount") as string;

  if (code) {
    return redirect(`/auth/google/callback?code=${code}`);
  }

  if (updateSheet === "true") {
    try {
      const accessToken = await getValidAccessToken(request);

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      const driveClient = google.drive({ version: "v3", auth: oauth2Client });
      const sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });

      const dateObj = new Date(date);
      const folderName = `reimbursement-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getFullYear()}`;
      const folderId = await findOrCreateFolder({ driveClient, folderName });
      if (!folderId) {
        return json({ success: false, error: "Failed to find or create folder" });
      }

      // Create or update the sheet
      const sheetName = `reimbursement-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getFullYear()}`;
      const sheetId = await findOrCreateSheet({ driveClient, folderId, sheetName });
    
      if (!sheetId) {
        return json({ success: false, error: "Failed to find or create sheet" });
      }
    
      await checkSheet({ sheetsClient, sheetId });
    
      await appendNewItemToSheet({ sheetsClient, sheetId, date, item, amount });

      return json({ success: true });
    } catch (error) {
      console.error("Error updating sheet:", error);
      return json({ success: false, error: "Failed to update sheet" });
    }
  }

  if (uploadImage === "true") {
    if (!base64 || !mimeType || !message || message.includes("error")) {
      return json({ success: false });
    }


    const filename = craftFilename({ date, item, amount, mimeType, page });

    const session = await getSession(request.headers.get("Cookie"));
    const user = session.get("user");

    if (!user) {
      return json({ success: false });
    }

    try {
      const accessToken = await getValidAccessToken(request);

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      const driveClient = google.drive({ version: "v3", auth: oauth2Client });

      const dateObj = new Date(date);
      const folderName = `reimbursement-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}-${dateObj.getFullYear()}`;
      const folderId = await findOrCreateFolder({ driveClient, folderName });
      if (!folderId) {
        return json({ success: false, error: "Failed to find or create folder" });
      }

      const fileMetadata = {
        name: filename,
        mimeType: mimeType,
        parents: [folderId],
      };

      // Convert base64 to buffer
      const buffer = Buffer.from(base64.split(",")[1], "base64");

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
        fields: "id",
      });

      console.log("File uploaded successfully. File ID:", response.data.id);
      return json({ success: true, fileId: response.data.id });
    } catch (error) {
      console.error("Error uploading file to Google Drive:", error);
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
  const actionData = useActionData<{ success: boolean; error?: string }>();
  const submit = useSubmit();
  const fetcher = useFetcher();

  const { uploadFile, receiptData } = useImageUpload();
  const {
    onAnalyzeReceipt,
    receiptInfo,
    setReceiptInfo,
    isScanning
  } = useGemini(GEMINI_API_KEY);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isSavingToQuickbooks, setIsSavingToQuickbooks] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Handle Google OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      submit({ code }, { method: "post" });
    }
  }, [submit]);

  useEffect(() => { 
    if (actionData) {
      setIsSavingToDrive(false);
      setIsSavingToQuickbooks(false);
      if (!actionData.success) {
        alert(`Error saving file: ${actionData.error || "Unknown error"}`);
      }
    }
  }, [actionData]);

  useEffect(() => {
    if (progress === 100) {
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
    }
  }, [progress]);

  const onSubmit = async () => {
    if (!receiptData) {
      alert("Please upload a receipt first");
      return;
    }

    await onAnalyzeReceipt(receiptData);
  };

  const onSaveToDrive = async () => {
    if (!receiptData || !receiptInfo || !receiptInfo.message || receiptInfo.message === "error") {
      alert("Please upload a receipt first and scan it");
      return;
    }

    if (!receiptInfo.date || !receiptInfo.item || !receiptInfo.amount) {
      alert("Please set date, item, and amount first");
      return;
    }

    try {
      setIsSavingToDrive(true);
      
      // Upload each image sequentially
      for (let i = 0; i < receiptData.length; i++) {
        setProgress(Math.round((i / receiptData.length) * 100));

        console.log("=======", receiptData[i]);
        submit({
          uploadImage: "true",
          base64: receiptData[i].base64 as string,
          page: receiptData[i].page.toString(),
          mimeType: receiptData[i].mimeType as string,
          message: receiptInfo.message as string,
          date: receiptInfo.date as string,
          item: receiptInfo.item as string,
          amount: receiptInfo.amount as string
        }, { method: "post" });

        console.log(receiptData[i]);
      }


      submit({
        updateSheet: "true",
        message: receiptInfo.message as string,
        date: receiptInfo.date as string,
        item: receiptInfo.item as string,
        amount: receiptInfo.amount as string 
      }, { method: "post" });
      
      setProgress(100);
    } catch (error) {
      alert("Error saving files");
      setIsSavingToDrive(false);
    }
  };

  const onSaveToQuickbooks = async () => {
    if (!receiptData || !receiptInfo || !receiptInfo.message || receiptInfo.message === "error") {
      alert("Please upload a receipt first and scan it");
      return;
    }

    if (!receiptInfo.date || !receiptInfo.item || !receiptInfo.amount) {
      alert("Please set date, item, and amount first");
      return;
    }

    try {
      setIsSavingToQuickbooks(true);
    } catch (error) {
      alert("Error saving file");
      setIsSavingToQuickbooks(false);
    }
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
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-4">
      <InfoBar name={user?.name} email={user?.email} />
      <div className="w-full flex flex-col items-center justify-around gap-4 py-8">
        <div className="w-full flex flex-col md:flex-row items-start justify-around gap-12">
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center gap-4">
            <ImageUploader onUpload={uploadFile} />
            <div className="w-full max-h-96 overflow-y-auto border-2 border-black rounded-md p-4">
              <ImagePreview receiptData={receiptData} />
            </div>
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
            <ImageResult receiptInfo={receiptInfo} setReceiptInfo={setReceiptInfo} />
            {uploadSuccess && (
              <div className="w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Success!</strong>
              </div>
            )}
            <div className="flex gap-4 items-center">
              <p className="font-bold">
                👉🏻 Step 3:
              </p>
              <button 
                className="border-2 border-black rounded-md px-4 py-2" 
                onClick={onSaveToDrive} 
                disabled={isSavingToDrive}
              >
                {isSavingToDrive ? `Saving... ${progress}%` : "Save to Drive"}
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <p className="font-bold">
              👉🏻 Step 4:
              </p>
              <button 
                className="border-2 border-black rounded-md px-4 py-2" 
                onClick={onSaveToQuickbooks} 
                disabled={isSavingToQuickbooks}
              >
                {isSavingToQuickbooks ? "Saving..." : "Save to Quickbooks"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;