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
 * Whether on-device library/notes may be shown or uploaded for the signed-in user.
 *
 * Guest / unowned data (`previousOwnerId` null) can be claimed by signup/signin.
 * Data already attributed to another account must never be kept or uploaded —
 * including when the new account's cloud library is empty or unreachable.
 */
export function shouldKeepLocalLibrary(options: {
  previousOwnerId: string | null;
  currentUserId: string;
}): boolean {
  if (!options.previousOwnerId) return true;
  return options.previousOwnerId === options.currentUserId;
}
