import { useState } from "react";
import type { ImageData } from "~/types";

const acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif", "application/pdf"];

const useReceipt = () => {
  const [receiptData, setReceiptData] = useState<ImageData[] | null>(null);

  const convertPdfToImage = async (file: File): Promise<ImageData[]> => {
    try {
      // Load the PDF.js library dynamically if needed
      const PDFJS = (window as any).pdfjsLib;
      if (!PDFJS) {
        throw new Error("PDF.js library not found");
      }
  
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Load the PDF document
      const pdfDoc = await PDFJS.getDocument({ url: fileUrl }).promise;
      const pages: ImageData[] = [];
      
      // Create a canvas element for rendering
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Canvas context could not be created");
      }
  
      // Process each page
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        // Get the page
        const page = await pdfDoc.getPage(pageNum);

        // Set viewport and canvas dimensions
        const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale as needed
        canvas.height = viewport.height;
        canvas.width = viewport.width;
  
        // Render the page
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
  
        // Convert canvas to base64 image
        const base64 = canvas.toDataURL("image/png");
        
        // Add to pages array
        pages.push({
          page: pageNum,
          base64: base64,
          mimeType: "image/png"
        });
      }
  
      // Clean up
      URL.revokeObjectURL(fileUrl);

      return pages;
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      throw error;
    }
  };

  const uploadFile = async (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      alert("Please upload a valid image file (PNG, JPEG, WEBP, HEIC, HEIF, or PDF)");
      return;
    }

    if (file.type === "application/pdf") {
      const images = await convertPdfToImage(file);

      setReceiptData(images);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptData([{
        page: 1,
        base64: e.target?.result as string,
        mimeType: file.type,
      }]);
    };
    reader.readAsDataURL(file);
  };

  return { uploadFile, receiptData };
};

export default useReceipt;
