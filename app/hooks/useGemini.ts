import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ImageData, ImageInfo } from "~/types";

const MAX_RETRIES = 5;

const prompt = `
  You will be provided a receipt, please read it and answer the following questions:
  1. What is the date of this transaction?
  2. What is the receipt for?
  3. What is the total price of the transaction?

  Please tell me the date, item, and price, answer in the following format:
  [[date]]: [[...]]
  [[item]]: [[...]]
  [[amount]]: [[...]]

  Note:
  1. you do not need to tell me all the subtotal, tax, and tip, just give me the description of the item and the total price of the transaction.
  2. the date should be in the format of YYYY-MM-DD

  OUTPUT EXAMPLE:
  [[date]]: [[2024-02-14]]
  [[item]]: [[Starbucks]]
  [[amount]]: [[$10.50]]

  If you can't regnize any of them, leave it blank like [[item]]: [[]]
  If there are multiple receipts in the image, please answer: [[message]]: [[error: multiple receipts]]
  If you think it's not a receipt, please answer: [[message]]: [[error: not a receipt]]
  Do not include any other content in your answer
`;

const useGemini = (GEMINI_API_KEY: string) => {
  const [imageInfo, setImageInfo] = useState<ImageInfo>({});

  const onAnalyzeImage = async (imageData: ImageData) => {
    const client = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = imageData.base64.split(',')[1];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageData.mimeType
      }
    };

    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const res = await model.generateContent([prompt, imagePart]);
        const text = res.response.text();
        parseImageInfo(text);
        if (imageInfo.message !== "error") {
          break;
        }
      } catch (error) {
        console.error("Error generating content:", error);
      }
      retries++;
    }
  };

  const parseImageInfo = (text: string) => {
    if (text.includes("error")) {
      setImageInfo({ message: text });
    } else {
      const lines = text.split('\n');
      const imageInfo: ImageInfo = {
        message: "success"
      };

      lines.forEach(line => {
        const match = line.match(/\[\[(.*?)\]\]: \[\[(.*?)\]\]/);
        if (match) {
          const [, key, value] = match;
          imageInfo[key as keyof ImageInfo] = value.trim();
        }
      });

      setImageInfo(imageInfo);
    }
  };

  return { onAnalyzeImage, imageInfo };
};

export default useGemini;