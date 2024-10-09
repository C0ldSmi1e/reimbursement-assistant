import type { ImageInfo } from "~/types";

const ImageResult: React.FC<{ imageInfo: ImageInfo, setImageInfo: (imageInfo: ImageInfo) => void }> = ({ imageInfo, setImageInfo }: { imageInfo: ImageInfo, setImageInfo: (imageInfo: ImageInfo) => void }) => {
  return (
    <div className="flex flex-col gap-4">
      {imageInfo.message && imageInfo.message.includes("error") && (
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
          value={imageInfo.date}
          onChange={(e) => setImageInfo({ ...imageInfo, date: e.target.value })}
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="item">Item:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="item"
          name="item"
          type="text"
          value={imageInfo.item}
          onChange={(e) => setImageInfo({ ...imageInfo, item: e.target.value })}
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="amount">Amount:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="amount"
          name="amount"
          type="text"
          value={imageInfo.amount}
          onChange={(e) => setImageInfo({ ...imageInfo, amount: e.target.value })}
        />
      </div>
    </div>
  );
};

export default ImageResult;