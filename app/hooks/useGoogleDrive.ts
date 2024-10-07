import { useState } from 'react';
import { google } from 'googleapis';
import type { ImageInfo, ImageData } from '~/types';

const useGoogleDrive = ({ accessToken, refreshToken }: { accessToken: string | undefined; refreshToken: string | undefined }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveToGoogleDrive = async ({ imageData, imageInfo }: { imageData: ImageData; imageInfo: ImageInfo }) => {
    setIsUploading(true);
    setError(null);

    if (!accessToken || !refreshToken) {
      setError('No access token or refresh token provided');
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    /*
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const filename = craftFilename({ imageInfo, imageData });

    const fileMetadata = {
      name: filename,
      mimeType: imageData.mimeType,
    };

    const media = {
      mimeType: imageData.mimeType,
      body: Buffer.from(imageData.base64, 'base64'),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
    });

    console.log('File uploaded successfully:', file.data);
  
    */}

  return { saveToGoogleDrive, isUploading, error };
}

const craftFilename = ({ imageInfo, imageData }: { imageInfo: ImageInfo, imageData: ImageData }) => {
  const parts = [];

  if (imageInfo.date) {
    parts.push(imageInfo.date.replace(/\D/g, '_'));
  }

  if (imageInfo.item) {
    parts.push(imageInfo.item.replace(/\W/g, '_'));
  }

  if (imageInfo.amount) {
    parts.push(imageInfo.amount.replace(/\D/g, '_'));
  }

  const extension = imageData?.mimeType.split('/')[1];

  return parts.join('_') + `.${extension}`;
};

export default useGoogleDrive;