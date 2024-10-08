import type { ImageData } from "~/types";

const ImagePreview: React.FC<{ imageData: ImageData | null }> = ({ imageData }: { imageData: ImageData | null }) => {
  return (
    <div className="w-full min-h-96 border-2 border-black rounded-md p-4 flex flex-col items-center justify-center">
      {imageData?.base64 ? (
        <img src={imageData.base64} alt="Uploaded" />
      ) : (
        <p>No image uploaded</p>
      )}
    </div>
  );
};

export default ImagePreview;