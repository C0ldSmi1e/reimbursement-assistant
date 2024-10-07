import { useState } from 'react';
import type { ImageData } from '~/types';

const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

const useImageUpload = () => {
  const [imageData, setImageData] = useState<ImageData | null>(null);

  const uploadImage = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPEG, WEBP, HEIC, or HEIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData({
        base64: e.target?.result as string,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);

    console.log(imageData?.base64);
    console.log(imageData?.mimeType);
  };

  return { uploadImage, imageData };
};

export default useImageUpload;