import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { usePlaylistStore } from "@/stores/playlistStore";
import { ensureSupabaseSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { analytics } from "@/services/analyticsService";
import { AppModal } from "@/components/AppModal";

export default function SignInPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const skipAuth = useAuthStore((s) => s.skipAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    await ensureSupabaseSession();
    await usePlaylistStore.getState().hydrateFromSupabase();
    navigate("/", { replace: true });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      analytics.track("auth_sign_in");
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSkip = async () => {
    skipAuth();
    analytics.track("auth_skipped");
    await finish();
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/35 via-ink-950 to-ink-950" />

      <div className="safe-top relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-neutral-300">Sign in to sync your playlists across devices</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-neutral-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-neutral-400">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white outline-none placeholder:text-neutral-500 focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          New here?{" "}
          <Link to="/sign-up" className="font-medium text-accent-soft">
            Create an account
          </Link>
        </p>

        <button
          onClick={() => void onSkip()}
          className="mt-4 text-center text-sm text-neutral-500 underline-offset-2 hover:underline"
        >
          Continue without an account
        </button>
      </div>

      <AppModal open={!!error} title="Sign in" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
