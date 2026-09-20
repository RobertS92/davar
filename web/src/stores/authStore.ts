import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  initAuth,
  signInWithPassword,
  signOutRemote,
  signUpWithPassword,
} from "@/lib/auth";

export type AuthUser = {
  id: string;
  email: string | null;
  displayName?: string | null;
  isAnonymous: boolean;
};

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  hasSeenAuthPrompt: boolean;
  setHasSeenAuthPrompt: (seen: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setInitialized: (value: boolean) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      initialized: false,
      hasSeenAuthPrompt: false,

      setHasSeenAuthPrompt: (hasSeenAuthPrompt) => set({ hasSeenAuthPrompt }),
      setInitialized: (initialized) => set({ initialized }),
      setUser: (user) => set({ user }),

      skipAuth: () => set({ hasSeenAuthPrompt: true }),

      initialize: async () => {
        await initAuth();
      },

      signIn: async (email, password) => {
        const user = await signInWithPassword(email, password);
        set({ user, hasSeenAuthPrompt: true });
      },

      signUp: async (email, password, displayName) => {
        const user = await signUpWithPassword(email, password, displayName);
        set({ user, hasSeenAuthPrompt: true });
      },

      signOut: async () => {
        await signOutRemote();
        set({ user: null, hasSeenAuthPrompt: true });
      },
    }),
    {
      name: "davar-web-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenAuthPrompt: state.hasSeenAuthPrompt,
        user: state.user,
      }),
    }
  )
);

export function isSignedInUser(user: AuthUser | null): boolean {
  return !!user && !user.isAnonymous && !!user.email;
}
