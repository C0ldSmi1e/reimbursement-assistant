import { useState } from "react";
import type { ImageInfo } from "~/types";

const ImageResult: React.FC<{ imageInfo: ImageInfo }> = ({ imageInfo }: { imageInfo: ImageInfo }) => {
  const [date, setDate] = useState(imageInfo.date);
  const [item, setItem] = useState(imageInfo.item);
  const [amount, setAmount] = useState(imageInfo.amount);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex gap-2">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <label htmlFor="item">Item</label>
        <input id="item" name="item" type="text" value={item} onChange={(e) => setItem(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <label htmlFor="amount">Amount</label>
        <input id="amount" name="amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
    </div>
  );
};

export default ImageResult;