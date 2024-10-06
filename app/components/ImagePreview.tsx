import type { ImageData } from "~/types";

const ImagePreview: React.FC<{ imageData: ImageData }> = ({ imageData }: { imageData: ImageData }) => {
  return <img src={imageData.base64} alt="Uploaded" />;
};

export default ImagePreview;