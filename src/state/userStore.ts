import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../services/authService";

interface UserState {
  user: User | null;
  isLoading: boolean;
  hasSeenAuthPrompt: boolean;

  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setHasSeenAuthPrompt: (seen: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      hasSeenAuthPrompt: false,

      setUser: (user) => set({ user, isLoading: false }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setHasSeenAuthPrompt: (seen) => set({ hasSeenAuthPrompt: seen }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "scripture-user",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenAuthPrompt: state.hasSeenAuthPrompt,
      }),
    }
  )
);
