interface ImageData {
  page: number;
  base64: string;
  mimeType: string;
}

interface ReceiptInfo {
  message?: string;
  date?: string;
  item?: string;
  amount?: string;
}

export type { ImageData, ReceiptInfo };
