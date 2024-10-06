import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import useImageUpload from "~/hooks/useImageUpload";
import ImagePreview from "~/components/ImagePreview";
import ImageUploader from "~/components/ImageUploader";
import useGemini from "~/hooks/useGemini";
import ImageResult from "~/components/ImageResult";

export const loader: LoaderFunction = async () => {
  return { GEMINI_API_KEY: process.env.GEMINI_API_KEY };
};

export const meta: MetaFunction = () => {
  return [
    { title: "Reimbursement Assistant" },
    { name: "description", content: "Reimbursement Assistant" },
  ];
};

const Index = () => {
  const { GEMINI_API_KEY } = useLoaderData<{ GEMINI_API_KEY: string }>();
  const { uploadImage, imageData } = useImageUpload();
  const { onAnalyzeImage, imageInfo } = useGemini(GEMINI_API_KEY);

  const onSubmit = async () => {
    if (!imageData) {
      console.error("No image uploaded");
      return;
    }

    await onAnalyzeImage(imageData);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <ImageUploader onUpload={uploadImage} />
      <div className="mt-4 w-96">
        {imageData && <ImagePreview imageData={imageData} />}
        <button onClick={onSubmit}>Submit</button>
      </div>
      {imageInfo.message === "success" && (
        <ImageResult imageInfo={imageInfo} />
      )}
    </div>
  );
}

export default Index;
