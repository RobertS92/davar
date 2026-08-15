import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

/** Ensure there is a Supabase session (signed-in or anonymous guest). */
export async function ensureSupabaseSession(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user) {
    useAuthStore.getState().setUserFromSession(existing.session.user);
    return existing.session.user.id;
  }

  // Guest path for users who skipped auth (requires Anonymous provider)
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn("Supabase guest session failed:", error.message);
    useAuthStore.getState().setUserFromSession(null);
    return null;
  }
  useAuthStore.getState().setUserFromSession(data.user);
  return data.user?.id ?? null;
}

export async function initAuthListener(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    useAuthStore.getState().setInitialized(true);
    return;
  }

  const { data } = await supabase.auth.getSession();
  useAuthStore.getState().setUserFromSession(data.session?.user ?? null);
  useAuthStore.getState().setInitialized(true);

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUserFromSession(session?.user ?? null);
  });
}

export { isSupabaseConfigured, getSupabase };
