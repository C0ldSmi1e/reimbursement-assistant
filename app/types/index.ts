type ImageData = {
  page: number;
  base64: string;
  mimeType: string;
}

type ReceiptInfo = {
  message?: string;
  date?: string;
  item?: string;
  amount?: string;
}

type Response = {
  success: boolean;
  error?: string;
};

export type {
  ImageData,
  ReceiptInfo,
  Response,
};
