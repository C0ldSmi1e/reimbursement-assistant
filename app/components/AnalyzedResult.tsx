import type { ReceiptInfo } from "~/types";

const AnalyzedResult: React.FC<{
  receiptInfo: ReceiptInfo,
  setReceiptInfo: (receiptInfo: ReceiptInfo) => void
}> = ({
  receiptInfo, setReceiptInfo
}: {
  receiptInfo: ReceiptInfo,
  setReceiptInfo: (receiptInfo: ReceiptInfo) => void
}) => {
  return (
    <div className="flex flex-col gap-4">
      {receiptInfo.message && receiptInfo.message.includes("error") && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! This might not be a receipt.</strong>
        </div>
      )}
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="date">Date:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="date"
          name="date"
          type="date"
          value={receiptInfo.date}
          onChange={(e) => setReceiptInfo({
            ...receiptInfo, date: e.target.value })}
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="item">Item:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="item"
          name="item"
          type="text"
          value={receiptInfo.item}
          onChange={(e) => setReceiptInfo({ ...receiptInfo, item: e.target.value })}
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="amount">Amount:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="amount"
          name="amount"
          type="text"
          value={receiptInfo.amount}
          onChange={(e) => setReceiptInfo({ ...receiptInfo, amount: e.target.value
          })}
        />
      </div>
    </div>
  );
};

export default AnalyzedResult;
