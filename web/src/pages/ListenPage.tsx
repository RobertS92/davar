import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { AppModal } from "@/components/AppModal";
import { formatClock } from "@/lib/cn";
import {
  isSpeechSupported,
  pauseSpeaking,
  resumeSpeaking,
  speakText,
  stopSpeaking,
  warmUpVoices,
  type TTSVoice,
} from "@/services/ttsService";
import { getPlaylistById, usePlaylistStore } from "@/stores/playlistStore";
import { usePreferencesStore } from "@/stores/preferencesStore";

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

  const playlist = getPlaylistById(playlists, id);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const item = playlist?.items[index];
  const progress = useMemo(() => {
    if (!item) return 0;
    return Math.min(1, elapsed / Math.max(item.estimatedDuration, 1));
  }, [elapsed, item]);

  useEffect(() => {
    warmUpVoices();
    if (playlist) addToRecent(playlist.id);
    return () => stopSpeaking();
  }, [playlist?.id]);

  useEffect(() => {
    if (!playing || paused) return;
    const timer = window.setInterval(() => setElapsed((e) => e + 0.25), 250);
    return () => window.clearInterval(timer);
  }, [playing, paused, index]);

  useEffect(() => {
    setElapsed(0);
    setPaused(false);
    if (playing && item) {
      startItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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

  const speakPayload = announce ? `${item.title}. ${item.text}` : item.text;

  const startItem = () => {
    if (!isSpeechSupported()) {
      setError("Speech is not supported in this browser. Use Read Mode instead.");
      setPlaying(false);
      return;
    }
    speakText(
      speakPayload,
      { voice, speed },
      {
        onStart: () => {
          setPlaying(true);
          setPaused(false);
        },
        onEnd: () => {
          if (index < playlist.items.length - 1) {
            setIndex((i) => i + 1);
          } else {
            setPlaying(false);
            markPlaylistCompleted(playlist.id);
          }
        },
        onError: (message) => {
          setPlaying(false);
          setError(message);
        },
      }
    );
    updatePlaybackProgress(playlist.id, item.id, 0);
  };

  const togglePlay = () => {
    if (!playing) {
      setElapsed(0);
      startItem();
      return;
    }
    if (paused) {
      resumeSpeaking();
      setPaused(false);
    } else {
      pauseSpeaking();
      setPaused(true);
    }
  };

  const goPrev = () => {
    stopSpeaking();
    setPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    stopSpeaking();
    setPlaying(false);
    setIndex((i) => Math.min(playlist.items.length - 1, i + 1));
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.28),transparent_45%)]" />

      <header className="safe-top relative z-10 flex items-center justify-between px-5 pt-2">
        <button
          onClick={() => {
            stopSpeaking();
            navigate(`/playlist/${playlist.id}`);
          }}
          className="rounded-full bg-white/5 p-2 text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Listen</p>
          <p className="text-sm text-neutral-200">{playlist.title}</p>
        </div>
        <Link to={`/read/${playlist.id}`} className="rounded-full bg-white/5 px-3 py-2 text-xs text-white">
          Read
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-8">
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm text-accent-soft">
            {index + 1} / {playlist.items.length}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">{item.title}</h1>
          <p className="mt-6 max-h-[42vh] overflow-y-auto text-lg leading-8 text-neutral-200">
            {item.text}
          </p>
        </div>

        <div className="mt-8">
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mb-6 flex justify-between text-xs text-neutral-500">
            <span>{formatClock(elapsed)}</span>
            <span>{formatClock(item.estimatedDuration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={goPrev} className="rounded-full bg-white/5 p-3 text-white" aria-label="Previous">
              <SkipBack className="h-6 w-6" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30"
              aria-label={playing && !paused ? "Pause" : "Play"}
            >
              {playing && !paused ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </button>
            <button onClick={goNext} className="rounded-full bg-white/5 p-3 text-white" aria-label="Next">
              <SkipForward className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-neutral-400">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(playlist.items.length - 1, i + 1))}
              className="inline-flex items-center gap-1 text-sm"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AppModal open={!!error} title="Audio unavailable" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
