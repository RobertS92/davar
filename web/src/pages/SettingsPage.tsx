import { useState } from "react";
import { Link } from "react-router-dom";
import type { PauseStyle, PlaybackSpeed, Translation } from "@/types/bible";
import { VOICE_OPTIONS } from "@/services/ttsService";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { isSignedInUser, useAuthStore } from "@/stores/authStore";
import { usePlaylistStore } from "@/stores/playlistStore";
import { cn } from "@/lib/cn";
import { isNivAvailable } from "@/lib/api";
import { analytics } from "@/services/analyticsService";
import { AppModal } from "@/components/AppModal";

export default function SettingsPage() {
  const prefs = usePreferencesStore();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const syncStatus = usePlaylistStore((s) => s.syncStatus);
  const hydrateFromSupabase = usePlaylistStore((s) => s.hydrateFromSupabase);
  const nivOk = isNivAvailable();
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const speeds: PlaybackSpeed[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const lengths = [10, 15, 20, 30, 45, 60];
  const textSizes = [16, 18, 20, 22, 24, 28];
  const pauses: PauseStyle[] = ["short", "medium", "long"];
  const signedIn = isSignedInUser(user);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      analytics.track("auth_sign_out");
      await hydrateFromSupabase();
      setMessage("Signed out. You can keep using Davar as a guest.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not sign out");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="safe-top flex flex-1 flex-col pb-10">
      <header className="px-5 pb-4 pt-2">
        <p className="font-display text-3xl font-semibold">Settings</p>
        <p className="mt-1 text-neutral-400">Account, sync, and playback preferences</p>
      </header>

      <div className="space-y-6 px-5 lg:max-w-2xl">
        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="mb-3 font-semibold text-white">Account</h2>
          {signedIn ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">
                Signed in as <span className="text-white">{user?.email}</span>
              </p>
              <p className="text-xs text-neutral-500">
                Cloud sync: {syncStatus === "synced" ? "up to date" : syncStatus}
              </p>
              <button
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-200 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">
                {user?.isAnonymous
                  ? "Using a guest session. Sign in to sync playlists across devices."
                  : "Sign in to sync playlists with Supabase."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/sign-in"
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-200"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="mb-3 font-semibold text-white">Defaults</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-neutral-400">Translation</p>
              <div className="grid grid-cols-2 gap-2">
                {(["KJV", "NIV"] as Translation[]).map((t) => (
                  <button
                    key={t}
                    disabled={t === "NIV" && !nivOk}
                    onClick={() => prefs.setDefaultTranslation(t)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium",
                      prefs.defaultTranslation === t
                        ? "bg-accent text-white"
                        : "bg-white/5 text-neutral-300",
                      t === "NIV" && !nivOk && "opacity-40"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {!nivOk && (
                <p className="mt-2 text-xs text-neutral-500">
                  NIV needs `EXPO_PUBLIC_BIBLE_API_KEY` or `VITE_BIBLE_API_KEY` from api.bible. KJV works offline.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Consumption mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(["listen", "read"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => prefs.setDefaultConsumptionMode(mode)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-medium capitalize",
                      prefs.defaultConsumptionMode === mode
                        ? "bg-accent text-white"
                        : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">OpenAI voice</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {VOICE_OPTIONS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => prefs.setDefaultVoice(voice.id)}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-left",
                      prefs.defaultVoice === voice.id
                        ? "bg-accent/20 ring-1 ring-accent"
                        : "bg-white/5"
                    )}
                  >
                    <p className="text-sm font-medium text-white">{voice.name}</p>
                    <p className="text-xs text-neutral-400">
                      {voice.gender} · {voice.style}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Pause between passages</p>
              <div className="grid grid-cols-3 gap-2">
                {pauses.map((style) => (
                  <button
                    key={style}
                    onClick={() => prefs.setPauseStyle(style)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium capitalize",
                      prefs.pauseStyle === style ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Playback speed</p>
              <div className="grid grid-cols-3 gap-2">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => prefs.setPlaybackSpeed(speed)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium",
                      prefs.playbackSpeed === speed ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-neutral-400">Playlist length</p>
              <div className="grid grid-cols-3 gap-2">
                {lengths.map((len) => (
                  <button
                    key={len}
                    onClick={() => prefs.setDefaultPlaylistLength(len)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium",
                      prefs.defaultPlaylistLength === len
                        ? "bg-accent text-white"
                        : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {len}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4">
          <h2 className="mb-3 font-semibold text-white">Reading</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-neutral-400">Text size</p>
              <div className="grid grid-cols-3 gap-2">
                {textSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => prefs.setTextSize(size)}
                    className={cn(
                      "rounded-xl py-2 text-sm font-medium",
                      prefs.textSize === size ? "bg-accent text-white" : "bg-white/5 text-neutral-300"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              label="Show verse numbers"
              value={prefs.showVerseNumbersInRead}
              onChange={prefs.setShowVerseNumbersInRead}
            />
            <Toggle label="Night mode" value={prefs.nightMode} onChange={prefs.setNightMode} />
            <Toggle
              label="Announce book and chapter"
              value={prefs.announceBookChapter}
              onChange={prefs.setAnnounceBookChapter}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-ink-850/70 p-4 text-sm text-neutral-400">
          <p className="font-semibold text-white">Backend</p>
          <p className="mt-2 leading-relaxed">
            Front end on Vercel. Accounts and playlist sync on Supabase. AI voices via Vercel API routes. No
            pricing tiers.
          </p>
        </section>
      </div>

      <AppModal open={!!message} title="Account" message={message || ""} onClose={() => setMessage(null)} />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-3"
    >
      <span className="text-sm text-neutral-200">{label}</span>
      <span className={cn("relative h-6 w-11 rounded-full transition", value ? "bg-accent" : "bg-neutral-600")}>
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            value ? "left-5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
