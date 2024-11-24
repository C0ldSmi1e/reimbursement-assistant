import { useEffect } from "react";
import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import ImagePreview from "~/components/ImagePreview";
import ImageUploader from "~/components/ImageUploader";
import useGemini from "~/hooks/useGemini";
import useReceipt from "~/hooks/useReceipt";
import AnalyzedResult from "~/components/AnalyzedResult";
import SaveToGoogleDrive from "~/components/SaveToGoogleDrive";
import { getGoogleAuthUrl } from "~/utils/googleAuth.server";
import { getSession } from "~/utils/session.server";
import InfoBar from "~/components/InfoBar";
import type { User } from "~/types";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user") as User | null;

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
  const {
    isLoggedIn,
    user,
    googleAuthUrl,
    GEMINI_API_KEY
  } = useLoaderData<{
    isLoggedIn: boolean;
    user?: User;
    googleAuthUrl?: string;
    GEMINI_API_KEY: string;
  }>();

  const actionData = useActionData<{
    success: boolean;
    error?: string;
  }>();

  const submit = useSubmit();

  const { uploadFile, receiptData } = useReceipt();

  const {
    onAnalyzeReceipt,
    receiptInfo,
    setReceiptInfo,
    isScanning
  } = useGemini(GEMINI_API_KEY);

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
      if (!actionData.success) {
        alert(`Error saving file: ${actionData.error || "Unknown error"}`);
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
            <AnalyzedResult receiptInfo={receiptInfo} setReceiptInfo={setReceiptInfo} />
            <SaveToGoogleDrive receiptInfo={receiptInfo} receiptData={receiptData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;