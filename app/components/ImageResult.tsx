import { useState, useEffect } from "react";
import type { ImageInfo } from "~/types";

const ImageResult: React.FC<{ imageInfo: ImageInfo }> = ({ imageInfo }: { imageInfo: ImageInfo }) => {
  const [message, setMessage] = useState(imageInfo.message || "");
  const [date, setDate] = useState(imageInfo.date || "");
  const [item, setItem] = useState(imageInfo.item || "");
  const [amount, setAmount] = useState(imageInfo.amount || "");

  useEffect(() => {
    setMessage(imageInfo.message || "");
    setDate(imageInfo.date || "");
    setItem(imageInfo.item || "");
    setAmount(imageInfo.amount || "");
  }, [imageInfo]);

  if (message.includes("error")) {
    return (<div className="mt-4 flex flex-col gap-8">
      Error
    </div>);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="date">Date:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="item">Item:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="item"
          name="item"
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-16" htmlFor="amount">Amount:</label>
        <input
          className="w-64 border-2 border-black rounded-md p-1"
          id="amount"
          name="amount"
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ImageResult;