import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { PlaylistCard } from "@/components/PlaylistCard";
import { Screen, ScreenHeader } from "@/components/Screen";
import { usePlaylistStore } from "@/stores/playlistStore";
import { cn } from "@/lib/cn";

type Filter = "all" | "favorites" | "offline" | "recent";

export default function LibraryPage() {
  const playlists = usePlaylistStore((s) => s.playlists);
  const recentIds = usePlaylistStore((s) => s.recentPlaylistIds);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = [...playlists];
    if (filter === "favorites") list = list.filter((p) => p.isFavorite);
    if (filter === "offline") list = list.filter((p) => p.isDownloaded);
    if (filter === "recent") {
      list = recentIds
        .map((id) => playlists.find((p) => p.id === id))
        .filter((p): p is (typeof playlists)[number] => !!p);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.items.some((i) => i.title.toLowerCase().includes(q))
    );
  }, [playlists, recentIds, query, filter]);

  return (
    <Screen>
      <ScreenHeader
        title="Library"
        subtitle={`${playlists.length} playlists saved on this device`}
        right={
          <Link
            to="/community"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-neutral-200"
          >
            <Users className="h-3.5 w-3.5" />
            Community
          </Link>
        }
      />

      <div className="px-5 pb-4 pt-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, tags, or verses"
            className="w-full rounded-2xl border border-white/10 bg-ink-850 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-accent"
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(["all", "favorites", "offline", "recent"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium capitalize",
                filter === f ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-neutral-400">
            No playlists yet. Create one from Home or Stations.
          </div>
        ) : (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {filtered.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
