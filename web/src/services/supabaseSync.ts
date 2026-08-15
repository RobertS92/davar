import type { Playlist } from "@/types/bible";
import { ensureSupabaseSession } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type PlaylistRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  items: Playlist["items"];
  translation: Playlist["translation"];
  total_duration: number;
  created_at: string;
  updated_at: string;
  source_type: Playlist["sourceType"];
  prompt_used: string | null;
  tags: string[];
  is_favorite: boolean;
  is_downloaded: boolean;
  last_played_at: string | null;
  last_played_item_id: string | null;
  last_played_position: number | null;
  completed_count: number;
};

function toRow(playlist: Playlist, userId: string): PlaylistRow {
  return {
    id: playlist.id,
    user_id: userId,
    title: playlist.title,
    description: playlist.description ?? null,
    items: playlist.items,
    translation: playlist.translation,
    total_duration: playlist.totalDuration,
    created_at: playlist.createdAt,
    updated_at: playlist.updatedAt,
    source_type: playlist.sourceType,
    prompt_used: playlist.promptUsed ?? null,
    tags: playlist.tags ?? [],
    is_favorite: playlist.isFavorite,
    is_downloaded: playlist.isDownloaded,
    last_played_at: playlist.lastPlayedAt ?? null,
    last_played_item_id: playlist.lastPlayedItemId ?? null,
    last_played_position: playlist.lastPlayedPosition ?? null,
    completed_count: playlist.completedCount ?? 0,
  };
}

function fromRow(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    items: row.items || [],
    translation: row.translation,
    totalDuration: row.total_duration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceType: row.source_type,
    promptUsed: row.prompt_used ?? undefined,
    tags: row.tags || [],
    isFavorite: row.is_favorite,
    isDownloaded: row.is_downloaded,
    lastPlayedAt: row.last_played_at ?? undefined,
    lastPlayedItemId: row.last_played_item_id ?? undefined,
    lastPlayedPosition: row.last_played_position ?? undefined,
    completedCount: row.completed_count ?? 0,
  };
}

export async function syncPlaylistToSupabase(playlist: Playlist): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const userId = await ensureSupabaseSession();
  if (!userId) return false;

  const { error } = await supabase.from("playlists").upsert(toRow(playlist, userId), {
    onConflict: "id",
  });
  if (error) {
    console.warn("Supabase playlist sync failed:", error.message);
    return false;
  }
  return true;
}

export async function deletePlaylistFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const userId = await ensureSupabaseSession();
  if (!userId) return false;

  const { error } = await supabase.from("playlists").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    console.warn("Supabase playlist delete failed:", error.message);
    return false;
  }
  return true;
}

export async function fetchPlaylistsFromSupabase(): Promise<Playlist[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const userId = await ensureSupabaseSession();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.warn("Supabase playlist fetch failed:", error?.message);
    return [];
  }

  return (data as PlaylistRow[]).map(fromRow);
}

/** Merge remote playlists into local list (remote wins on newer updatedAt). */
export function mergePlaylists(local: Playlist[], remote: Playlist[]): Playlist[] {
  const map = new Map<string, Playlist>();
  for (const p of local) map.set(p.id, p);
  for (const p of remote) {
    const existing = map.get(p.id);
    if (!existing || new Date(p.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      map.set(p.id, p);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function pushAllPlaylists(playlists: Playlist[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  for (const playlist of playlists) {
    await syncPlaylistToSupabase(playlist);
  }
}
