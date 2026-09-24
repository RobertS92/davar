import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Moon, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { cn, formatClock } from "@/lib/cn";
import {
  getSpeakingPosition,
  pauseSpeaking,
  pauseStyleDelayMs,
  resumeSpeaking,
  seekSpeaking,
  setSpeakingRate,
  speakText,
  stopSpeaking,
  warmUpVoices,
  type TTSVoice,
} from "@/services/ttsService";
import { getPlaylistById, usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { analytics } from "@/services/analyticsService";
import type { PauseStyle } from "@/types/bible";

const SLEEP_OPTIONS = [5, 10, 15, 30, 45, 60];

export default function ListenPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playlists = usePlaylistStore((s) => s.playlists);
  const addToRecent = usePlaylistStore((s) => s.addToRecent);
  const updatePlaybackProgress = usePlaylistStore((s) => s.updatePlaybackProgress);
  const markPlaylistCompleted = usePlaylistStore((s) => s.markPlaylistCompleted);

  const voice = usePreferencesStore((s) => s.defaultVoice) as TTSVoice;
  const speed = usePreferencesStore((s) => s.playbackSpeed);
  const announce = usePreferencesStore((s) => s.announceBookChapter);
  const speakVerseNumbers = usePreferencesStore((s) => s.speakVerseNumbers);
  const pauseStyle = usePreferencesStore((s) => s.pauseStyle) as PauseStyle;

  const playlist = getPlaylistById(playlists, id);
  const initialIndex = useMemo(() => {
    if (!playlist?.lastPlayedItemId) return 0;
    const found = playlist.items.findIndex((item) => item.id === playlist.lastPlayedItemId);
    return found >= 0 ? found : 0;
  }, [playlist?.id, playlist?.lastPlayedItemId, playlist?.items]);

  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<"openai" | "speech" | null>(null);
  const [showSleep, setShowSleep] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [didInitResume, setDidInitResume] = useState(false);

  const playingRef = useRef(false);
  const indexRef = useRef(0);
  const sleepTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const resumePositionRef = useRef(playlist?.lastPlayedPosition || 0);

  const item = playlist?.items[index];
  const progress = useMemo(() => {
    const total = duration || item?.estimatedDuration || 1;
    return Math.min(1, elapsed / total);
  }, [elapsed, duration, item]);

  useEffect(() => {
    warmUpVoices();
    if (playlist) {
      addToRecent(playlist.id);
      analytics.track("listen_opened", { playlistId: playlist.id });
      setIndex(initialIndex);
      resumePositionRef.current = playlist.lastPlayedPosition || 0;
      setDidInitResume(false);
    }
    return () => {
      if (playlist) {
        const pos = getSpeakingPosition();
        const current = playlist.items[indexRef.current];
        if (current) updatePlaybackProgress(playlist.id, current.id, pos);
      }
      stopSpeaking();
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    };
  }, [playlist?.id]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    playingRef.current = playing && !paused;
  }, [playing, paused]);

  useEffect(() => {
    setSpeakingRate(speed);
  }, [speed]);

  useEffect(() => {
    if (!playing || paused || engine === "openai") return;
    const timer = window.setInterval(() => setElapsed((e) => e + 0.25), 250);
    return () => window.clearInterval(timer);
  }, [playing, paused, index, engine]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        void togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) goPrev();
        else seekBy(-10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) goNext();
        else seekBy(10);
      } else if (e.key === "Escape") {
        stopSpeaking();
        navigate(`/playlist/${playlist?.id || ""}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!playlist || !item) {
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

  const advanceAfterPause = (fromIndex: number) => {
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = window.setTimeout(() => {
      const next = fromIndex + 1;
      if (next < playlist.items.length) {
        setIndex(next);
        void startItemAt(next, 0);
      } else {
        setPlaying(false);
        markPlaylistCompleted(playlist.id);
        analytics.track("playlist_completed", { playlistId: playlist.id, mode: "listen" });
      }
    }, pauseStyleDelayMs(pauseStyle));
  };

  const startItemAt = async (itemIndex: number, startAt = 0) => {
    const nextItem = playlist.items[itemIndex];
    if (!nextItem) return;
    setLoading(true);
    setElapsed(startAt);
    setDuration(nextItem.estimatedDuration);
    setPaused(false);
    setError(null);

    let text = nextItem.text;
    if (speakVerseNumbers && nextItem.verses?.length) {
      text = nextItem.verses
        .map((v) => `Verse ${v.verse}. ${v.text}`)
        .join(" ");
    }
    if (announce) text = `${nextItem.title}. ${text}`;

    try {
      const used = await speakText(
        text,
        { voice, speed, preferOpenAi: true, startAt },
        {
          onStart: () => {
            setPlaying(true);
            setPaused(false);
            setLoading(false);
          },
          onTimeUpdate: (current, total) => {
            setElapsed(current);
            if (total) setDuration(total);
            if (Math.floor(current) % 5 === 0) {
              updatePlaybackProgress(playlist.id, nextItem.id, current);
            }
          },
          onEnd: () => {
            updatePlaybackProgress(playlist.id, nextItem.id, 0);
            advanceAfterPause(itemIndex);
          },
          onError: (message) => {
            setLoading(false);
            setPlaying(false);
            setError(message);
          },
        }
      );
      setEngine(used);
      updatePlaybackProgress(playlist.id, nextItem.id, startAt);
      analytics.track("playlist_played", { playlistId: playlist.id, itemId: nextItem.id });
    } catch {
      setLoading(false);
      setPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (!playing) {
      const resumeAt =
        !didInitResume && index === initialIndex ? resumePositionRef.current || 0 : 0;
      setDidInitResume(true);
      await startItemAt(index, resumeAt > 1 ? resumeAt : 0);
      return;
    }
    if (paused) {
      resumeSpeaking();
      setPaused(false);
    } else {
      const pos = getSpeakingPosition();
      updatePlaybackProgress(playlist.id, item.id, pos);
      pauseSpeaking();
      setPaused(true);
    }
  };

  const goPrev = () => {
    stopSpeaking();
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    setPlaying(false);
    setDidInitResume(true);
    resumePositionRef.current = 0;
    setIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    stopSpeaking();
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    setPlaying(false);
    setDidInitResume(true);
    resumePositionRef.current = 0;
    setIndex((i) => Math.min(playlist.items.length - 1, i + 1));
  };

  const seekBy = (delta: number) => {
    if (engine !== "openai") return;
    const next = Math.max(0, elapsed + delta);
    seekSpeaking(next);
    setElapsed(next);
    updatePlaybackProgress(playlist.id, item.id, next);
  };

  const seekToRatio = (ratio: number) => {
    if (engine !== "openai") return;
    const total = duration || item.estimatedDuration || 0;
    const next = Math.max(0, Math.min(total, ratio * total));
    seekSpeaking(next);
    setElapsed(next);
    updatePlaybackProgress(playlist.id, item.id, next);
  };

  const startSleepTimer = (minutes: number) => {
    if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
    setSleepMinutes(minutes);
    setSleepEndsAt(Date.now() + minutes * 60_000);
    sleepTimerRef.current = window.setTimeout(() => {
      stopSpeaking();
      setPlaying(false);
      setPaused(false);
      setSleepMinutes(null);
      setSleepEndsAt(null);
      analytics.track("sleep_timer_fired", { minutes });
    }, minutes * 60_000);
    setShowSleep(false);
    analytics.track("sleep_timer_set", { minutes });
  };

  const cancelSleepTimer = () => {
    if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
    setSleepMinutes(null);
    setSleepEndsAt(null);
    setShowSleep(false);
  };

  const remainingSleep = sleepEndsAt
    ? Math.max(0, Math.ceil((sleepEndsAt - Date.now()) / 60_000))
    : 0;

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--glow),transparent_45%)]" />

      <header className="safe-top relative z-10 flex items-center justify-between px-5 pt-2">
        <button
          onClick={() => {
            const pos = getSpeakingPosition();
            updatePlaybackProgress(playlist.id, item.id, pos);
            stopSpeaking();
            navigate(`/playlist/${playlist.id}`);
          }}
          className="rounded-full bg-white/5 p-2 text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Listen</p>
          <p className="text-sm text-neutral-200">{playlist.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSleep(true)}
            className={cn("rounded-full p-2", sleepMinutes ? "bg-accent/20 text-accent-soft" : "bg-white/5 text-white")}
            aria-label="Sleep timer"
          >
            <Moon className="h-5 w-5" />
          </button>
          <Link to={`/read/${playlist.id}`} className="rounded-full bg-white/5 px-3 py-2 text-xs text-white">
            Read
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-10 pt-8 lg:flex-row lg:gap-10 lg:pt-12">
        <div className="flex flex-1 flex-col justify-center lg:max-w-xl">
          <p className="text-sm text-accent-soft">
            {index + 1} / {playlist.items.length}
            {!didInitResume && (playlist.lastPlayedPosition || 0) > 1 ? " · Resume ready" : ""}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white lg:text-4xl">{item.title}</h1>
          <p className="mt-6 max-h-[40vh] overflow-y-auto text-lg leading-8 text-neutral-200 lg:max-h-[50vh]">
            {item.text}
          </p>
          {loading && (
            <p className="mt-4 animate-pulse-soft text-sm text-accent-soft">Generating audio…</p>
          )}
        </div>

        <div className="mt-8 w-full lg:mt-0 lg:w-[320px] lg:shrink-0 lg:self-center">
          <button
            type="button"
            className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white/10"
            aria-label="Seek"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seekToRatio(ratio);
            }}
          >
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress * 100}%` }} />
          </button>
          <div className="mb-6 flex justify-between text-xs text-neutral-500">
            <span>{formatClock(elapsed)}</span>
            <span>{formatClock(duration || item.estimatedDuration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={goPrev} className="rounded-full bg-white/5 p-3 text-white" aria-label="Previous">
              <SkipBack className="h-6 w-6" />
            </button>
            <button
              onClick={() => void togglePlay()}
              disabled={loading}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 disabled:opacity-60"
              aria-label={playing && !paused ? "Pause" : "Play"}
            >
              {playing && !paused ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </button>
            <button onClick={goNext} className="rounded-full bg-white/5 p-3 text-white" aria-label="Next">
              <SkipForward className="h-6 w-6" />
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-neutral-500">
            {speed}x · {pauseStyle} pauses
            {engine ? ` · ${engine === "openai" ? "OpenAI voice" : "Device voice"}` : ""}
            {sleepMinutes ? ` · Sleep in ${remainingSleep}m` : ""}
          </p>
          <p className="mt-2 hidden text-center text-[11px] text-neutral-600 lg:block">
            Space play/pause · ←/→ seek · Shift+←/→ track · Esc close
          </p>
        </div>
      </div>

      {showSleep && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <button className="absolute inset-0" aria-label="Dismiss" onClick={() => setShowSleep(false)} />
          <div className="glass relative w-full max-w-md rounded-t-3xl p-5 shadow-sheet sm:rounded-3xl">
            <h2 className="mb-4 font-display text-xl font-semibold">Sleep Timer</h2>
            {sleepMinutes ? (
              <div className="text-center">
                <p className="text-neutral-300">Playback stops in about {remainingSleep} minutes.</p>
                <button
                  onClick={cancelSleepTimer}
                  className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300"
                >
                  Cancel timer
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {SLEEP_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => startSleepTimer(m)}
                    className="rounded-xl bg-white/5 py-3 text-sm font-medium text-white hover:bg-accent/20"
                  >
                    {m} min
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <AppModal open={!!error} title="Audio unavailable" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
