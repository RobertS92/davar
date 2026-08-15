import { Link } from "react-router-dom";
import { Car, Heart, Moon, BookOpen, Sparkles, PenLine } from "lucide-react";
import { InstallBanner } from "@/components/InstallBanner";
import { PlaylistCard } from "@/components/PlaylistCard";
import { getFavorites, getRecentPlaylists, usePlaylistStore } from "@/stores/playlistStore";

const modes = [
  { id: "bedtime", title: "Bedtime", icon: Moon, color: "#6366f1" },
  { id: "commute", title: "Commute", icon: Car, color: "#f59e0b" },
  { id: "study", title: "Study", icon: BookOpen, color: "#10b981" },
  { id: "prayer", title: "Prayer", icon: Heart, color: "#ec4899" },
];

export default function HomePage() {
  const playlists = usePlaylistStore((s) => s.playlists);
  const recentIds = usePlaylistStore((s) => s.recentPlaylistIds);
  const recent = getRecentPlaylists(playlists, recentIds);
  const favorites = getFavorites(playlists);

  return (
    <div className="safe-top flex flex-1 flex-col pb-6">
      <header className="px-5 pb-4 pt-2">
        <p className="font-display text-3xl font-semibold text-white">Davar</p>
        <p className="mt-1 text-neutral-400">Listen or read the Word</p>
      </header>

      <InstallBanner />

      <div className="space-y-8 px-5">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Create Playlist</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/create/prompt"
              className="gradient-action min-h-[110px] rounded-2xl p-4 text-white active:opacity-90"
            >
              <Sparkles className="h-7 w-7" />
              <p className="mt-3 font-semibold">Create with AI</p>
              <p className="text-sm text-white/80">Describe what you need</p>
            </Link>
            <Link
              to="/create/manual"
              className="gradient-manual min-h-[110px] rounded-2xl p-4 text-white active:opacity-90"
            >
              <PenLine className="h-7 w-7" />
              <p className="mt-3 font-semibold">Manual Entry</p>
              <p className="text-sm text-white/80">Enter specific verses</p>
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Modes</h2>
            <Link to="/modes" className="text-sm text-accent-soft">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {modes.map((mode) => (
              <Link
                key={mode.id}
                to={`/create/prompt?mode=${mode.id}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-ink-850/80 px-2 py-4"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${mode.color}22`, color: mode.color }}
                >
                  <mode.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-neutral-200">{mode.title}</span>
              </Link>
            ))}
          </div>
        </section>

        {recent.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Recent</h2>
            <div className="space-y-3">
              {recent.slice(0, 4).map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          </section>
        )}

        {favorites.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Favorites</h2>
            <div className="space-y-3">
              {favorites.slice(0, 4).map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          </section>
        )}

        {playlists.length === 0 && (
          <section className="rounded-3xl border border-dashed border-white/10 bg-ink-850/40 p-6 text-center">
            <p className="font-display text-xl text-white">Start with a Station</p>
            <p className="mt-2 text-sm text-neutral-400">
              Tap Stations for instant playlists like The Messiah, Faith, or Marriage.
            </p>
            <Link
              to="/stations"
              className="mt-4 inline-flex rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse Stations
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
