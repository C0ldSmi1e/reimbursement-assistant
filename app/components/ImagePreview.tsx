import type { ImageData } from "~/types";

// TODO: Some images are not showing up.

const ImagePreview: React.FC<{
  receiptData: ImageData[] | null;
}> = ({ receiptData }: { receiptData: ImageData[] | null }) => {
  return (
    <div
      className="w-full h-full p-4 flex flex-col gap-4 items-center justify-center overflow-y-auto"
    >
      {receiptData ? (
        receiptData.map((image) => (
          <img
            key={image.page}
            src={image.base64}
            alt={`Page ${image.page}`}
            className="w-full"
          />
        ))
      ) : (
        <p>No image uploaded</p>
      )}
    </div>
  );
};

export default ImagePreview;