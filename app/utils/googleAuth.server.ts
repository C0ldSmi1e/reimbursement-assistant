import { redirect } from "@remix-run/node";
import { google } from "googleapis";
import {
  getSession,
  commitSession,
  destroySession,
} from "~/utils/session.server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getGoogleAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
};

const getGoogleUser = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    version: "v2",
    auth: oauth2Client,
  });
  const { data } = await oauth2.userinfo.get();

  console.log(tokens.refresh_token);

  return {
    email: data.email,
    name: data.name,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date,
  };
};

const refreshGoogleToken = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user || !user.refreshToken) {
    throw redirect("/login");
  }

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    // Update the access token
    user.accessToken = credentials.access_token;

    // Check if a new refresh token was issued
    if (credentials.refresh_token) {
      console.log("Received new refresh token. Updating...");
      user.refreshToken = credentials.refresh_token;
    }

    // Update the expiration time
    user.expiresAt = credentials.expiry_date || Date.now() + 3600 * 1000; // Default to 1 hour if not provided

    // Update the session
    session.set("user", user);

    // Return the updated user and a header to set the new session cookie
    return {
      user,
      headers: { "Set-Cookie": await commitSession(session) }
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    // If refresh fails, clear session and redirect to login
    throw redirect("/login", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }
};

const getValidAccessToken = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user || !user.accessToken) {
    throw redirect("/login");
  }

  // Check if token is expired or about to expire (within 5 minutes)
  if (!user.expiresAt || user.expiresAt < Date.now() + 5 * 60 * 1000) {
    const { headers } = await refreshGoogleToken(request);
    // Redirect to the same page to ensure the new session is used
    throw redirect(request.url, { headers });
  }

  return user.accessToken;
};

export {
  getGoogleAuthUrl,
  getGoogleUser,
  refreshGoogleToken,
  getValidAccessToken
};
