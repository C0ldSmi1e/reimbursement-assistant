import React, { useRef } from "react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp, image/heic, image/heif, application/pdf"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
      />
      <div className="flex gap-4 items-center">
        <p className="font-bold">
          👉🏻 Step 1:
        </p>
        <button
          className="border-2 border-black rounded-md px-4 py-2"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          Upload A Receipt
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;