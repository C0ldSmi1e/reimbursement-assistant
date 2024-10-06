import { useState, useRef } from "react";
import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { GoogleGenerativeAI } from "@google/generative-ai";
//import { GoogleAIFileManager } from "@google/generative-ai/server";
import type { ImageData } from "~/types";

export const loader: LoaderFunction = async () => {
  return { GEMINI_API_KEY: process.env.GEMINI_API_KEY };
};

export const meta: MetaFunction = () => {
  return [
    { title: "Reimbursement Assistant" },
    { name: "description", content: "Reimbursement Assistant" },
  ];
};

const Index = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { GEMINI_API_KEY } = useLoaderData<{ GEMINI_API_KEY: string }>();

  const onSubmit = async () => {
    if (!GEMINI_API_KEY) {
      console.error("Gemini API key is not set");
      return;
    }

    if (!imageData) {
      console.error("No image uploaded");
      return;
    }

    const client = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extract the base64 data (remove the "data:image/...;base64," prefix)
    const base64Data = imageData.base64.split(',')[1];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageData.mimeType
      }
    };

    const prompt = `
      You will be provided a receipt, please read it and answer the following questions:
      1. What is the date of this transaction?
      2. What is the receipt for?
      3. What is the total price of the transaction?

      Please tell me the date, item, and price, answer in the following format:
      [[date]]: [[...]]
      [[item]]: [[...]]
      [[amount]]: [[...]]

      Note: you do not need to tell me all the subtotal, tax, and tip, just give me the description of the item and the total price of the transaction.

      OUTPUT EXAMPLE:
      [[date]]: [[2024-02-14]]
      [[item]]: [[Starbucks]]
      [[amount]]: [[$10.50]]

      If you can't regnize any of them, leave it blank like [[item]]: [[]]
      If there are multiple receipts in the image, please answer: [[message]]: [[error: multiple receipts]]
      If you think it's not a receipt, please answer: [[message]]: [[error: not a receipt]]
      Do not include any other content in your answer
    `;

    try {
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      console.log(text);
      setResponse(text);
    } catch (error) {
      console.error("Error generating content:", error);
    } 
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
      if (acceptedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setImage(base64);
          setImageData({
            base64: base64,
            mimeType: file.type
          });
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please upload a valid image file (PNG, JPEG, WEBP, HEIC, or HEIF)');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={onSubmit}>Submit</button>
      
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
        onChange={handleImageUpload}
        ref={fileInputRef}
        className="hidden"
      />
      <button onClick={() => fileInputRef.current?.click()}>Upload Image</button>
      
      {image && (
        <div className="mt-4">
          <img src={image} alt="Uploaded" className="max-w-xs max-h-xs" />
        </div>
      )}
      
      {response && <div className="mt-4">{response}</div>}
    </div>
  );
}

export default Index;
