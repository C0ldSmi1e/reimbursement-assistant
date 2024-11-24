import { useState } from "react";
import Together from "together-ai";
import type { ReceiptInfo, ImageData  } from "~/types";

const prompt = `
  You will be provided a receipt, it might be a single page or multiple pages of images.
  Please read it and answer the following questions:
  1. What is the date of this transaction? (the date in the receipt might be different, e.g. mm/dd/yy, mm/dd/yyyy, or yyyy-mm-dd, you should recognize the date)
  2. What is the receipt for?
  3. What is the total price of the transaction?

  Please tell me the date, item, and price, answer in the json format:
  {
    date: "YYYY-MM-DD",
    item: "...",
    price: "..."
  }

  Note:
  1. you do not need to tell me all the subtotal, tax, and tip, just give me the description of the item and the total price of the transaction.
  2. the date should be in the format of YYYY-MM-DD

  Do not include any content other than the date, item, and price in your answer.
`;

const useTogether = (TOGETHER_API_KEY: string) => {
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo>({});
  const [isLoading, setIsLoading] = useState(false);

  const together = new Together({ apiKey: TOGETHER_API_KEY });

  const onAnalyzeReceipt = async (receiptData: ImageData[]) => {
    setIsLoading(true);

    const imageParts = receiptData.map((image) => ({
      inlineData: {
        data: image.base64.split(",")[1],
        mimeType: image.mimeType
      }
    }));


    const image_urls = receiptData.map((image) => ({
      type: "image_url",
      image_url: {
        url: image.base64,
      },
    }));

    try {
      const res = await together.chat.completions.create({
        model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
        messages: [
          {
            role: "user",
            // @ts-expect-error
            content: [
              { type: "text", text: prompt },
              ...image_urls,
            ],
          },
        ],
      });
      const text = res?.choices[0]?.message?.content;
      console.log(text);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      alert("Failed to analyze image, please try again");
      setIsLoading(false);
    }
  };

  return {
    receiptInfo,
    setReceiptInfo,
    isLoading,
    onAnalyzeReceipt,
  };
};

export default useTogether;