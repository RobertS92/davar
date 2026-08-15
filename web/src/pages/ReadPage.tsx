import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Headphones, X } from "lucide-react";
import { getPlaylistById, usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { cn } from "@/lib/cn";

export default function ReadPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playlists = usePlaylistStore((s) => s.playlists);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const textSize = usePreferencesStore((s) => s.textSize);
  const nightMode = usePreferencesStore((s) => s.nightMode);
  const showVerseNumbers = usePreferencesStore((s) => s.showVerseNumbersInRead);

  const playlist = getPlaylistById(playlists, id);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (playlist) addToRecent(playlist.id);
  }, [playlist?.id]);

  if (!playlist) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-2xl">Playlist not found</p>
          <Link to="/library" className="mt-3 inline-block text-accent-soft">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const item = playlist.items[index];

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (dx < -50) setIndex((i) => Math.min(playlist.items.length - 1, i + 1));
    if (dx > 50) setIndex((i) => Math.max(0, i - 1));
    touchStartX.current = null;
  };

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col",
        nightMode ? "bg-ink-950 text-neutral-100" : "bg-[#f3efe6] text-neutral-900"
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="safe-top flex items-center justify-between px-5 pt-2">
        <button
          onClick={() => navigate(`/playlist/${playlist.id}`)}
          className={cn("rounded-full p-2", nightMode ? "bg-white/5 text-white" : "bg-black/5")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className={cn("text-xs uppercase tracking-[0.16em]", nightMode ? "text-neutral-400" : "text-neutral-500")}>
            Read
          </p>
          <p className="text-sm">{playlist.title}</p>
        </div>
        <Link
          to={`/listen/${playlist.id}`}
          className={cn("rounded-full px-3 py-2 text-xs", nightMode ? "bg-white/5 text-white" : "bg-black/5")}
        >
          <span className="inline-flex items-center gap-1">
            <Headphones className="h-3.5 w-3.5" /> Listen
          </span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-10 pt-8">
        <p className={cn("text-sm", nightMode ? "text-accent-soft" : "text-indigo-700")}>
          {index + 1} / {playlist.items.length}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold">{item.title}</h1>

        <div className="mt-8 flex-1 overflow-y-auto">
          {item.verses.map((verse) => (
            <p key={`${verse.chapter}-${verse.verse}`} className="mb-4 leading-relaxed" style={{ fontSize: textSize }}>
              {showVerseNumbers && (
                <sup className={cn("mr-1 text-[0.7em]", nightMode ? "text-accent-soft" : "text-indigo-600")}>
                  {verse.verse}
                </sup>
              )}
              {verse.text}
            </p>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className={cn(
              "inline-flex items-center gap-1 rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-30",
              nightMode ? "bg-white/5" : "bg-black/5"
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(playlist.items.length - 1, i + 1))}
            disabled={index === playlist.items.length - 1}
            className={cn(
              "inline-flex items-center gap-1 rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-30",
              nightMode ? "bg-white/5" : "bg-black/5"
            )}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className={cn("mt-4 text-center text-xs", nightMode ? "text-neutral-500" : "text-neutral-500")}>
          Swipe left or right on mobile to move between cards
        </p>
      </div>
    </div>
  );
}
