interface ImageData {
  base64: string;
  mimeType: string;
}

interface ImageInfo {
  message?: string;
  date?: string;
  item?: string;
  amount?: string;
}

export type { ImageData, ImageInfo };
