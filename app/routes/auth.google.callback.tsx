import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { getGoogleUser } from "~/utils/googleAuth.server";
import { getSession, commitSession } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    console.error("No code found in callback URL");
    return redirect("/");
  }

  try {
    const user = await getGoogleUser(code);
    const session = await getSession(request.headers.get("Cookie"));
    session.set("user", user);

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error("Error in Google authentication:", error);
    return redirect("/");
  }
};