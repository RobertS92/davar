import { apiFetch, postJson } from "@/lib/api";
import type { Playlist } from "@/types/bible";

export type CommunitySort = "popular" | "new" | "featured";

export interface CommunityPlaylistMeta {
  id: string;
  userId?: string;
  displayName: string;
  title: string;
  description?: string | null;
  translation: string;
  totalDuration: number;
  itemCount: number;
  voteCount: number;
  importCount: number;
  isFeatured: boolean;
  createdAt: string;
}

export async function createShareCode(playlist: Playlist): Promise<{ code: string; expiresAt: string }> {
  return postJson("/social/share", { playlist }, true);
}

export async function importShareCode(code: string): Promise<{ playlist: Playlist; expiresAt: string }> {
  return apiFetch(`/social/import/${encodeURIComponent(code.trim().toUpperCase())}`);
}

export async function submitToCommunity(
  playlist: Playlist,
  displayName?: string
): Promise<{ id: string; title: string; displayName: string }> {
  return postJson("/social/community/submit", { playlist, displayName }, true);
}

export async function listCommunity(sort: CommunitySort = "popular"): Promise<CommunityPlaylistMeta[]> {
  const data = await apiFetch<{ playlists: CommunityPlaylistMeta[] }>(
    `/social/community?sort=${encodeURIComponent(sort)}&limit=30`
  );
  return data.playlists || [];
}

export async function getCommunityPlaylist(
  id: string
): Promise<CommunityPlaylistMeta & { playlist: Playlist }> {
  return apiFetch(`/social/community/${encodeURIComponent(id)}`);
}

export async function voteCommunityPlaylist(id: string): Promise<{ voted: boolean; voteCount: number }> {
  return postJson(`/social/community/${encodeURIComponent(id)}/vote`, {}, true);
}
