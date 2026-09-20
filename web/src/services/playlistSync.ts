import type { Playlist } from "@/types/bible";
import { apiFetch, getAccessToken, isBackendConfigured, postJson } from "@/lib/api";

export async function syncPlaylistToBackend(playlist: Playlist): Promise<boolean> {
  if (!isBackendConfigured() || !getAccessToken()) return false;
  try {
    await postJson("/playlists/sync", { playlist }, true);
    return true;
  } catch (error) {
    console.warn("Playlist sync failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function deletePlaylistFromBackend(id: string): Promise<boolean> {
  if (!isBackendConfigured() || !getAccessToken()) return false;
  try {
    await apiFetch(`/playlists/${id}`, { method: "DELETE", auth: true });
    return true;
  } catch (error) {
    console.warn("Playlist delete failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function fetchPlaylistsFromBackend(): Promise<Playlist[]> {
  if (!isBackendConfigured() || !getAccessToken()) return [];
  try {
    const data = await apiFetch<{ playlists: Playlist[] }>("/playlists", { auth: true });
    return data.playlists || [];
  } catch (error) {
    console.warn("Playlist fetch failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

/** Merge remote playlists into local list (remote wins on newer updatedAt). */
export function mergePlaylists(local: Playlist[], remote: Playlist[]): Playlist[] {
  const map = new Map<string, Playlist>();
  for (const p of local) map.set(p.id, p);
  for (const p of remote) {
    const existing = map.get(p.id);
    if (!existing || new Date(p.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      map.set(p.id, {
        ...p,
        isDownloaded: existing?.isDownloaded ?? p.isDownloaded ?? false,
        items: p.items?.length ? p.items : existing?.items || [],
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
