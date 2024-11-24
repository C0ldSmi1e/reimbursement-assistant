import { createCookieSessionStorage } from "@remix-run/node";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [process.env.SESSION_SECRET as string],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // an hour
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});

export { getSession, commitSession, destroySession };