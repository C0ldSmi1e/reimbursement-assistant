import { useEffect, useState } from "react";
import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useFetcher } from "@remix-run/react";
import ImagePreview from "~/components/ImagePreview";
import ImageUploader from "~/components/ImageUploader";
import useGemini from "~/hooks/useGemini";
import useReceipt from "~/hooks/useReceipt";
import ImageResult from "~/components/ImageResult";
import { getGoogleAuthUrl } from "~/utils/googleAuth.server";
import { getSession } from "~/utils/session.server";
import InfoBar from "~/components/InfoBar";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    const googleAuthUrl = getGoogleAuthUrl();
    return json({
      isLoggedIn: false,
      googleAuthUrl,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY
    });
  }

  return json({
    isLoggedIn: true,
    user,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: "Reimbursement Assistant" },
    {
      name: "description",
      content: "Reimbursement Assistant"
    },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const code = formData.get("code");
  if (code) {
    return redirect(`/auth/google/callback?code=${code}`);
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

  const { uploadFile, receiptData } = useReceipt();
  const {
    onAnalyzeReceipt,
    receiptInfo,
    setReceiptInfo,
    isScanning
  } = useGemini(GEMINI_API_KEY);
  const [isSavingToQuickbooks, setIsSavingToQuickbooks] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
      setIsSavingToQuickbooks(false);
      if (!actionData.success) {
        alert(`Error saving file: ${actionData.error || "Unknown error"}`);
      } else {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
      }
    }
  }, [actionData]);

  const onSubmit = async () => {
    if (!receiptData) {
      alert("Please upload a receipt first");
      return;
    }

    await onAnalyzeReceipt(receiptData);
  };

  const onSaveToGoogleDrive = async () => {
    if (!receiptData || !receiptInfo || !receiptInfo.message || receiptInfo.message === "error") {
      alert("Please upload a receipt first and scan it");
      return;
    }

    if (!receiptInfo.date || !receiptInfo.item || !receiptInfo.amount) {
      alert("Please set date, item, and amount first");
      return;
    }

    try {
      const payload = {
        uploadImage: "true",
        receiptData,
        receiptInfo
      };

      fetcher.submit(
        {
          dataStr: JSON.stringify(payload),
        },
        {
          method: "post",
          action: "/save/google-drive",
        },
      );

    } catch (error) {
      alert("Error saving files");
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
                onClick={onSaveToGoogleDrive} 
                disabled={fetcher.state !== "idle"}
              >
                {fetcher.state !== "idle" ? "Saving..." : "Save to Drive"}
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