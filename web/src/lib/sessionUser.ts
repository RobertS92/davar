import { getAccessToken } from "./api";

/** Read the authenticated user id from the access token JWT. */
export function getSessionUserId(): string | null {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { userId?: string };
    const userId = payload.userId ? String(payload.userId) : "";
    return userId || null;
  } catch {
    return null;
  }
}

/**
 * Decide whether local library/notes should be kept when the signed-in
 * account differs from the previous ownerId.
 *
 * - migrateLocal (signup / claim): always keep local and attach to the new account
 * - remote empty: keep local (guest library or recovery after server wipe)
 * - remote has data: drop previous account's local data for privacy
 */
export function shouldKeepLocalOnAccountSwitch(options: {
  migrateLocal?: boolean;
  remoteCount: number;
}): boolean {
  if (options.migrateLocal) return true;
  return options.remoteCount === 0;
}
