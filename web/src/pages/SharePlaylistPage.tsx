import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Share2, Users } from "lucide-react";
import { Screen, ScreenHeader } from "@/components/Screen";
import { AppModal } from "@/components/AppModal";
import { getPlaylistById, usePlaylistStore } from "@/stores/playlistStore";
import { isSignedInUser, useAuthStore } from "@/stores/authStore";
import { isBackendConfigured } from "@/lib/api";
import {
  createShareCode,
  importShareCode,
  submitToCommunity,
} from "@/services/socialService";
import { analytics } from "@/services/analyticsService";
import type { Playlist } from "@/types/bible";

function cloneImportedPlaylist(source: Playlist): Playlist {
  const now = new Date().toISOString();
  return {
    ...source,
    id: `import_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isDownloaded: false,
    lastPlayedAt: undefined,
    lastPlayedItemId: undefined,
    lastPlayedPosition: undefined,
    completedCount: 0,
    sourceType: source.sourceType || "manual",
    tags: [...(source.tags || []), "imported"],
  };
}

export default function SharePlaylistPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const playlists = usePlaylistStore((s) => s.playlists);
  const addPlaylist = usePlaylistStore((s) => s.addPlaylist);
  const user = useAuthStore((s) => s.user);
  const signedIn = isSignedInUser(user);
  const backendOk = isBackendConfigured();

  const playlist = getPlaylistById(playlists, id);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [importCode, setImportCode] = useState(params.get("code") || "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canShare = useMemo(() => backendOk && signedIn && !!playlist, [backendOk, signedIn, playlist]);

  const handleCreateCode = async () => {
    if (!playlist) return;
    if (!signedIn) {
      setMessage("Sign in to create a share code.");
      return;
    }
    setBusy(true);
    try {
      const result = await createShareCode(playlist);
      setCode(result.code);
      setExpiresAt(result.expiresAt);
      analytics.track("share_created", { playlistId: playlist.id });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create share code");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("Could not copy to clipboard");
    }
  };

  const handleNativeShare = async () => {
    if (!code || !navigator.share) return;
    try {
      await navigator.share({
        title: playlist?.title || "Davar playlist",
        text: `Import this Scripture playlist in Davar with code ${code}`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleImport = async () => {
    if (!importCode.trim()) return;
    setBusy(true);
    try {
      const result = await importShareCode(importCode.trim());
      const local = cloneImportedPlaylist(result.playlist);
      addPlaylist(local);
      analytics.track("share_imported", { code: importCode.trim().toUpperCase() });
      navigate(`/playlist/${local.id}`, { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not import playlist");
    } finally {
      setBusy(false);
    }
  };

  const handleCommunitySubmit = async () => {
    if (!playlist) return;
    if (!signedIn) {
      setMessage("Sign in to submit to the community.");
      return;
    }
    setBusy(true);
    try {
      await submitToCommunity(playlist, user?.displayName || undefined);
      analytics.track("community_submitted", { playlistId: playlist.id });
      setMessage("Submitted to the community. Others can discover it under Community.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not submit playlist");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Share"
        subtitle="Codes expire after 90 days"
        left={
          <button
            onClick={() => navigate(-1)}
            className="rounded-full bg-white/5 p-2 text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-6 px-5 pb-4 pt-4 lg:max-w-2xl">
        {playlist ? (
          <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Playlist</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-white">{playlist.title}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {playlist.items.length} passages · {playlist.translation}
            </p>

            {!backendOk && (
              <p className="mt-3 text-sm text-amber-200/90">
                Connect `VITE_API_URL` to enable sharing.
              </p>
            )}
            {backendOk && !signedIn && (
              <p className="mt-3 text-sm text-neutral-300">
                <Link to="/sign-in" className="text-accent-soft underline">
                  Sign in
                </Link>{" "}
                to create share codes or submit to community.
              </p>
            )}

            <button
              onClick={() => void handleCreateCode()}
              disabled={!canShare || busy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              {busy ? "Working…" : "Generate share code"}
            </button>

            {code && (
              <div className="mt-4 rounded-2xl bg-white/5 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Share code</p>
                <p className="mt-2 font-display text-3xl font-semibold tracking-[0.2em] text-white">
                  {code}
                </p>
                {expiresAt && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Expires {new Date(expiresAt).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => void handleCopy()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  {"share" in navigator && (
                    <button
                      onClick={() => void handleNativeShare()}
                      className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white"
                    >
                      Share…
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => void handleCommunitySubmit()}
              disabled={!canShare || busy}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm font-medium text-neutral-200 disabled:opacity-50"
            >
              <Users className="h-4 w-4" />
              Submit to community
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-neutral-400">
            Open Share from a playlist detail page, or import a code below.
          </section>
        )}

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="font-semibold text-white">Import by code</h2>
          <p className="mt-1 text-sm text-neutral-400">Paste a six-character code from another reader.</p>
          <input
            value={importCode}
            onChange={(e) => setImportCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABC123"
            className="mt-4 w-full rounded-2xl border border-white/10 bg-ink-950 px-4 py-3 text-center text-lg tracking-[0.3em] text-white outline-none focus:border-accent"
          />
          <button
            onClick={() => void handleImport()}
            disabled={busy || importCode.trim().length < 4}
            className="mt-3 w-full rounded-2xl bg-white/10 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Import playlist
          </button>
          <Link to="/community" className="mt-4 block text-center text-sm text-accent-soft">
            Browse community
          </Link>
        </section>
      </div>

      <AppModal open={!!message} title="Share" message={message || ""} onClose={() => setMessage(null)} />
    </Screen>
  );
}
