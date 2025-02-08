import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ReceiptInfo, ImageData  } from "~/types";

const MAX_RETRIES = 5;

const prompt = `
# You will be provided a receipt or invoice, it might be a single page or multiple pages of images.

** IMPORTANT: YOU MUST OBEY ALL INSTRUCTIONS BELOW **

** Please read the receipt and recognize the following information: **
1. date: the date of this transaction
2. item: the name of the store
3. amount: the total price of the transaction

** Note: **
1. the date might be in the format of YYYY-MM-DD, mm/dd/yy, mm/dd/yyyy, etc. You should recognize the date and format it as YYYY-MM-DD
2. you do not need to tell me all the subtotal, tax, and tip, just give me the description of the item and the total price of the transaction.
3. you can read the receipt again and again, until you are sure about the information.
4. your response should not include characters other than English letters, and numbers, and spaces.

** Please give me the date, item, and price in json format: **

\`\`\`json
{
  date: "YYYY-MM-DD",
  item: "...",
  amount: "..."
}
\`\`\`

OUTPUT EXAMPLE:

\`\`\`json
{
  date: "2024-02-14",
  item: "Starbucks",
  amount: "$10.50"
}
\`\`\`

If you can't regnize any of the information, leave it as an empty string. For example, if you can't recognize the item, you should return:
\`\`\`json
{
  date: "YYYY-MM-DD",
  item: "",
  amount: "..."
}
\`\`\`

If you think the receipts or invoices belong to different transactions, please answer:
\`\`\`json
{
  message: "error: multiple transactions"
}
\`\`\`

If you think it's not a receipt, please answer:
\`\`\`json
{
  message: "error: not a receipt"
}
\`\`\`

** LAST BUT NOT LEAST, DO NOT include any content other than the json in your answer. **
`;

const useGemini = (GEMINI_API_KEY: string) => {
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo>({});
  const [isLoading, setIsLoading] = useState(false);

  const onAnalyzeReceipt = async (receiptData: ImageData[]) => {
    setIsLoading(true);
    const client = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imageParts = receiptData.map((image) => ({
      inlineData: {
        data: image.base64.split(",")[1],
        mimeType: image.mimeType
      }
    }));

    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const res = await model.generateContent([prompt, ...imageParts]);
        const text = res.response.text();
        // await parseReceiptInfo(text);

        if (text.includes("error")) {
          setReceiptInfo({ message: text });
          break;
        }

        const parsedText = text.replace("```json", "").replace("```", "");
        console.log(parsedText);
        const json = parseJson(parsedText);

        console.log(json);

        if (json) {
          setReceiptInfo({
            message: "success",
            ...json,
          });
          break;
        }
      } catch (error) {
        alert("Failed to analyze image, please try again");
        setIsLoading(false);
        return;
      }
      retries++;
    }
    setIsLoading(false);
  };

  const parseJson = (text: string) => {
    try {
      // Replace single quotes with double quotes and ensure property names are properly quoted
      const formattedText = text.trim()
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, "\"$2\":")  // Properly quote property names
        .replace(/'/g, "\"");  // Replace any remaining single quotes with double quotes
      return JSON.parse(formattedText);
    } catch (error) {
      console.error("JSON parsing error:", error);
      return null;
    }
  };

  /*
  const parseReceiptInfo = async (text: string) => {
    if (text.includes("error")) {
      setReceiptInfo({ message: text });
    } else {
      const lines = text.split("\n");
      const receiptInfo: ReceiptInfo = {
        message: "success"
      };

      lines.forEach(line => {
        const match = line.match(/\[\[(.*?)\]\]: \[\[(.*?)\]\]/);
        if (match) {
          const [, key, value] = match;
          receiptInfo[key as keyof ReceiptInfo] = value.trim();
        }
      });

      setReceiptInfo(receiptInfo);
    }
  };
  */

  return {
    onAnalyzeReceipt,
    receiptInfo,
    setReceiptInfo,
    isScanning: isLoading,
  };
};

export default useGemini;