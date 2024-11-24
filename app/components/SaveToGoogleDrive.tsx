import { useFetcher } from "@remix-run/react";
import type { ReceiptInfo, ImageData } from "~/types";

const SaveToGoogleDrive = ({
  receiptInfo,
  receiptData
}: {
  receiptInfo: ReceiptInfo,
  receiptData: ImageData[] | null
}) => {
  const fetcher = useFetcher();

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

  return (
    <>
      {fetcher.data?.success && (
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
    </>
  );
};

export default SaveToGoogleDrive;
