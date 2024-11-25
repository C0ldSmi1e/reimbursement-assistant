import { getSession } from "~/utils/session.server";
import type { User } from "~/types";
import { refreshGoogleToken } from "~/utils/googleAuth.server";

const authenticate = async (request: Request) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user") as User | null;
  const { accessToken, refreshToken, expiresAt } = user || {};

  if (!accessToken || !refreshToken || !expiresAt) {
    return false;
  }

  if (expiresAt < Date.now()) {
    await refreshGoogleToken(request);
  }

  return true;
};

export { authenticate };