import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
};

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  hasSeenAuthPrompt: boolean;
  setHasSeenAuthPrompt: (seen: boolean) => void;
  setUserFromSession: (user: User | null) => void;
  setInitialized: (value: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
}

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    isAnonymous: Boolean(user.is_anonymous),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      initialized: false,
      hasSeenAuthPrompt: false,

      setHasSeenAuthPrompt: (hasSeenAuthPrompt) => set({ hasSeenAuthPrompt }),
      setInitialized: (initialized) => set({ initialized }),
      setUserFromSession: (user) => set({ user: mapUser(user) }),

      skipAuth: () => set({ hasSeenAuthPrompt: true }),

      signIn: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase is not configured");

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw new Error(error.message);
        set({
          user: mapUser(data.user),
          hasSeenAuthPrompt: true,
        });
      },

      signUp: async (email, password, displayName) => {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase is not configured");

        const current = get().user;
        // Upgrade anonymous session so existing playlists stay with this account
        if (current?.isAnonymous) {
          const { data, error } = await supabase.auth.updateUser({
            email: email.trim(),
            password,
            data: displayName ? { display_name: displayName } : undefined,
          });
          if (error) throw new Error(error.message);
          set({
            user: mapUser(data.user),
            hasSeenAuthPrompt: true,
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: displayName ? { display_name: displayName } : undefined,
          },
        });
        if (error) throw new Error(error.message);
        if (!data.session) {
          throw new Error(
            "Check your email to confirm your account, then sign in."
          );
        }
        set({
          user: mapUser(data.user),
          hasSeenAuthPrompt: true,
        });
      },

      signOut: async () => {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({ user: null, hasSeenAuthPrompt: true });
        if (isSupabaseConfigured() && supabase) {
          // Keep a guest session for local-only sync if anonymous is enabled
          const { data } = await supabase.auth.signInAnonymously();
          set({ user: mapUser(data.user ?? null) });
        }
      },
    }),
    {
      name: "davar-web-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenAuthPrompt: state.hasSeenAuthPrompt,
      }),
    }
  )
);

export function isSignedInUser(user: AuthUser | null): boolean {
  return !!user && !user.isAnonymous && !!user.email;
}
