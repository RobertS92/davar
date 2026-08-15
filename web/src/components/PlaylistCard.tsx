import type { Playlist } from "@/types/bible";
import { Heart, Headphones, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDuration } from "@/lib/cn";
import { usePreferencesStore } from "@/stores/preferencesStore";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const mode = usePreferencesStore((s) => s.defaultConsumptionMode);
  const href = mode === "read" ? `/read/${playlist.id}` : `/listen/${playlist.id}`;

  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="block rounded-2xl border border-white/5 bg-ink-850/80 p-4 transition hover:border-white/10 active:scale-[0.99]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{playlist.title}</h3>
          <p className="mt-1 text-sm text-neutral-400">
            {playlist.items.length} passages · {formatDuration(playlist.totalDuration)}
          </p>
        </div>
        {playlist.isFavorite && <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />}
      </div>
      <div className="flex gap-2">
        <Link
          to={href}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-200"
        >
          {mode === "read" ? <BookOpen className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
          Open
        </Link>
        <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-neutral-400">
          {playlist.translation}
        </span>
      </div>
    </Link>
  );
}
