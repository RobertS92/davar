import { Playlist } from "../types/bible";
import { getApiBaseUrl, isBackendConfigured } from "../api/config";
import { authService } from "./authService";

export type SyncResult =
  | { ok: true; synced: number }
  | { ok: false; error: string };

async function authHeaders(): Promise<Record<string, string>> {
  const token = await authService.getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

class PlaylistSyncService {
  isAvailable(): boolean {
    return isBackendConfigured() && authService.isAuthenticated();
  }

  async syncPlaylist(playlist: Playlist): Promise<boolean> {
    if (!this.isAvailable()) return false;

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return false;

    try {
      const response = await fetch(`${baseUrl}/playlists/sync`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ playlist }),
      });

      if (!response.ok) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return false;

    try {
      const response = await fetch(`${baseUrl}/playlists/${playlistId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchRemotePlaylists(): Promise<Playlist[]> {
    if (!this.isAvailable()) return [];

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return [];

    try {
      const response = await fetch(`${baseUrl}/playlists`, {
        headers: await authHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data.playlists) ? data.playlists : [];
    } catch {
      return [];
    }
  }

  /**
   * Push all local playlists, then merge any remote-only playlists.
   */
  async syncAll(localPlaylists: Playlist[]): Promise<SyncResult> {
    if (!isBackendConfigured()) {
      return {
        ok: false,
        error: "Cloud sync is not configured. Set a backend URL in Settings.",
      };
    }

    if (!authService.isAuthenticated()) {
      return {
        ok: false,
        error: "Sign in to sync playlists across devices.",
      };
    }

    try {
      let synced = 0;
      for (const playlist of localPlaylists) {
        const ok = await this.syncPlaylist(playlist);
        if (ok) synced += 1;
      }

      return { ok: true, synced };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      };
    }
  }

  /**
   * Merge remote playlists into local list (remote wins on newer updatedAt).
   */
  mergePlaylists(local: Playlist[], remote: Playlist[]): Playlist[] {
    const byId = new Map<string, Playlist>();

    for (const playlist of local) {
      byId.set(playlist.id, playlist);
    }

    for (const remotePlaylist of remote) {
      const existing = byId.get(remotePlaylist.id);
      if (!existing) {
        byId.set(remotePlaylist.id, remotePlaylist);
        continue;
      }

      const localTime = Date.parse(existing.updatedAt || existing.createdAt);
      const remoteTime = Date.parse(remotePlaylist.updatedAt || remotePlaylist.createdAt);
      if (remoteTime >= localTime) {
        byId.set(remotePlaylist.id, {
          ...remotePlaylist,
          // Preserve local offline download state
          isDownloaded: existing.isDownloaded,
          items: remotePlaylist.items.map((item, index) => ({
            ...item,
            isDownloaded: existing.items[index]?.isDownloaded ?? item.isDownloaded,
            audioUri: existing.items[index]?.audioUri ?? item.audioUri,
          })),
        });
      }
    }

    return Array.from(byId.values()).sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    );
  }
}

export const playlistSyncService = new PlaylistSyncService();
