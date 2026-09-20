import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { usePlaylistStore } from "@/stores/playlistStore";
import { isBackendConfigured } from "@/lib/api";
import { analytics } from "@/services/analyticsService";
import { AppModal } from "@/components/AppModal";

export default function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const skipAuth = useAuthStore((s) => s.skipAuth);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    analytics.setUserId(useAuthStore.getState().user?.id ?? null);
    await usePlaylistStore.getState().hydrateFromBackend();
    navigate("/", { replace: true });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter an email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!isBackendConfigured()) {
      setError("Backend is not configured. Add VITE_API_URL pointing to your Railway service.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password, displayName.trim() || undefined);
      analytics.track("auth_sign_up");
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
          <h1 className="font-display text-3xl font-semibold text-white">Create account</h1>
          <p className="mt-2 text-neutral-300">Save and sync playlists across your devices</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-neutral-400">Display name (optional)</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-accent"
            />
          </label>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link to="/sign-in" className="font-medium text-accent-soft">
            Sign in
          </Link>
        </p>

        <button
          onClick={() => void onSkip()}
          className="mt-4 text-center text-sm text-neutral-500 underline-offset-2 hover:underline"
        >
          Continue without an account
        </button>
      </div>

      <AppModal open={!!error} title="Sign up" message={error || ""} onClose={() => setError(null)} />
    </div>
  );
}
