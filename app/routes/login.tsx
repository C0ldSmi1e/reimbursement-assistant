import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getGoogleAuthUrl } from "~/utils/googleAuth.server";

export const loader = () => {
  return json({
    googleAuthUrl: getGoogleAuthUrl(),
  });
};

const Login = () => {
  const { googleAuthUrl } = useLoaderData<{
    googleAuthUrl: string;
  }>();

  return (
    <div className="flex items-center justify-center h-screen">
      <a href={googleAuthUrl} className="border-2 border-black rounded-md px-4 py-2">
        Login with Google
      </a>
    </div>
  );
};

export default Login;
