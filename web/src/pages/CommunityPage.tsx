import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, RefreshCw } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/Screen";
import { AppModal } from "@/components/AppModal";
import { cn, formatDuration } from "@/lib/cn";
import { isSignedInUser, useAuthStore } from "@/stores/authStore";
import { isBackendConfigured } from "@/lib/api";
import { usePlaylistStore } from "@/stores/playlistStore";
import {
  getCommunityPlaylist,
  listCommunity,
  voteCommunityPlaylist,
  type CommunityPlaylistMeta,
  type CommunitySort,
} from "@/services/socialService";
import { analytics } from "@/services/analyticsService";
import type { Playlist } from "@/types/bible";

function cloneImportedPlaylist(source: Playlist): Playlist {
  const now = new Date().toISOString();
  return {
    ...source,
    id: `community_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isDownloaded: false,
    completedCount: 0,
    tags: [...(source.tags || []), "community"],
  };
}

export default function CommunityPage() {
  const navigate = useNavigate();
  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const user = useAuthStore((s) => s.user);
  const signedIn = isSignedInUser(user);
  const backendOk = isBackendConfigured();

  const [sort, setSort] = useState<CommunitySort>("popular");
  const [rows, setRows] = useState<CommunityPlaylistMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!backendOk) {
      setError("Connect the Railway API (`VITE_API_URL`) to browse community playlists.");
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listCommunity(sort);
      setRows(list);
      analytics.track("community_viewed", { sort });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [backendOk, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleImport = async (id: string) => {
    setLoading(true);
    try {
      const detail = await getCommunityPlaylist(id);
      const local = cloneImportedPlaylist(detail.playlist);
      addPlaylist(local);
      analytics.track("community_imported", { playlistId: id });
      navigate(`/playlist/${local.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not import playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: string) => {
    if (!signedIn) {
      setMessage("Sign in to vote on community playlists.");
      return;
    }
    try {
      const result = await voteCommunityPlaylist(id);
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, voteCount: result.voteCount } : row))
      );
      analytics.track("community_voted", { playlistId: id, voted: result.voted });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not vote");
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Community"
        subtitle="Discover shared Scripture playlists"
        left={
          <Link to="/library" className="rounded-full bg-white/5 p-2 text-white" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        }
        right={
          <button
            onClick={() => void load()}
            className="rounded-full bg-white/5 p-2 text-white"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </button>
        }
      />

      <div className="px-5 pb-4 pt-4 lg:max-w-3xl">
        <div className="mb-5 flex gap-2">
          {(["popular", "new", "featured"] as CommunitySort[]).map((value) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize",
                sort === value ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
              )}
            >
              {value}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {error}
          </div>
        )}

        {!error && rows.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-neutral-400">
            No community playlists yet. Share one from a playlist detail page.
          </div>
        )}

        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-white">{row.title}</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    by {row.displayName} · {row.itemCount} passages ·{" "}
                    {formatDuration(row.totalDuration)} · {row.translation}
                  </p>
                </div>
                {row.isFeatured && (
                  <span className="rounded-full bg-accent/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                    Featured
                  </span>
                )}
              </div>
              {row.description && (
                <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{row.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void handleVote(row.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm text-neutral-200"
                >
                  <Heart className="h-4 w-4 text-rose-300" />
                  {row.voteCount}
                </button>
                <span className="text-xs text-neutral-500">{row.importCount} imports</span>
                <button
                  onClick={() => void handleImport(row.id)}
                  disabled={loading}
                  className="ml-auto rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Add to library
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <AppModal open={!!message} title="Community" message={message || ""} onClose={() => setMessage(null)} />
    </Screen>
  );
}
