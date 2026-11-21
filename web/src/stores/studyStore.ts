import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiFetch, getAccessToken, isBackendConfigured, postJson } from "@/lib/api";
import { shouldKeepLocalOnAccountSwitch } from "@/lib/sessionUser";

export type NoteScope = "book" | "chapter" | "verse";
export interface StudyNote {
  id: string;
  book: string;
  chapter: number | null;
  verse: number | null;
  scope: NoteScope;
  text: string;
  updatedAt: string;
  deleted?: boolean;
}

export type StudyHydrateOptions = {
  migrateLocal?: boolean;
};

interface ReaderState {
  notes: StudyNote[];
  position: { book: string; chapter: number };
  ownerId: string | null;
  syncStatus: "local" | "syncing" | "synced" | "error";
  setPosition: (book: string, chapter: number) => void;
  saveNote: (note: StudyNote) => void;
  deleteNote: (id: string) => void;
  hydrate: (userId: string | null, options?: StudyHydrateOptions) => Promise<void>;
  clearForSignOut: () => void;
}

const queue = new Map<string, ReturnType<typeof setTimeout>>();

function syncNote(note: StudyNote) {
  if (!isBackendConfigured() || !getAccessToken()) return;
  const existing = queue.get(note.id);
  if (existing) clearTimeout(existing);
  queue.set(
    note.id,
    setTimeout(() => {
      queue.delete(note.id);
      void postJson("/study/notes", { note }, true)
        .then(() => {
          useStudyStore.setState({ syncStatus: "synced" });
        })
        .catch(() => useStudyStore.setState({ syncStatus: "error" }));
    }, 650)
  );
}

export const useStudyStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      notes: [],
      position: { book: "Genesis", chapter: 1 },
      ownerId: null,
      syncStatus: "local",
      setPosition: (book, chapter) => set({ position: { book, chapter } }),
      saveNote: (note) => {
        set((state) => ({
          notes: [...state.notes.filter((n) => n.id !== note.id), note],
          syncStatus: "local",
        }));
        syncNote(note);
      },
      deleteNote: (id) => {
        const old = get().notes.find((n) => n.id === id);
        if (!old) return;
        get().saveNote({ ...old, text: "", deleted: true, updatedAt: new Date().toISOString() });
      },
      clearForSignOut: () => {
        for (const timer of queue.values()) clearTimeout(timer);
        queue.clear();
        set({
          notes: [],
          ownerId: null,
          position: { book: "Genesis", chapter: 1 },
          syncStatus: "local",
        });
      },
      hydrate: async (userId, options) => {
        if (!userId) return;

        const state = get();
        const previousOwnerId = state.ownerId;
        const localNotes = state.notes;
        const localPosition = state.position;
        const switchingAccount = !!previousOwnerId && previousOwnerId !== userId;

        set({ ownerId: userId });

        if (!isBackendConfigured() || !getAccessToken()) {
          set({ syncStatus: "error" });
          return;
        }

        set({ syncStatus: "syncing" });
        try {
          const response = await apiFetch<{ notes: StudyNote[] }>("/study/notes", { auth: true });
          const remote = response.notes || [];
          const keepLocal =
            !switchingAccount ||
            shouldKeepLocalOnAccountSwitch({
              migrateLocal: options?.migrateLocal,
              remoteCount: remote.filter((n) => !n.deleted && n.text.trim()).length,
            });

          const merged = new Map<string, StudyNote>();
          for (const n of remote) merged.set(n.id, n);
          if (keepLocal) {
            for (const n of localNotes) {
              const old = merged.get(n.id);
              if (!old || n.updatedAt > old.updatedAt) merged.set(n.id, n);
            }
          }

          set({
            notes: [...merged.values()],
            position: keepLocal ? localPosition : { book: "Genesis", chapter: 1 },
            syncStatus: "syncing",
          });

          for (const n of merged.values()) {
            const old = remote.find((r) => r.id === n.id);
            if (!old || n.updatedAt > old.updatedAt) {
              await postJson("/study/notes", { note: n }, true);
            }
          }
          set({ syncStatus: "synced" });
        } catch {
          if (localNotes.length > 0) {
            set({ notes: localNotes, position: localPosition, syncStatus: "error" });
          } else {
            set({ syncStatus: "error" });
          }
        }
      },
    }),
    {
      name: "davar-web-study-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notes: state.notes, position: state.position, ownerId: state.ownerId }),
    }
  )
);
