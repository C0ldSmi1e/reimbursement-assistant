type User = {
  name: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

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

interface Response {
  success: boolean;
  error?: string;
  data?: object;
}

export type {
  ImageData,
  ReceiptInfo,
  Response,
  User,
};
