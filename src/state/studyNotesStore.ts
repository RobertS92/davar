import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StudyNoteScope = "verse" | "chapter" | "book";
export interface StudyNote {
  id: string;
  book: string;
  chapter?: number;
  verse?: number;
  scope: StudyNoteScope;
  text: string;
  createdAt: string;
  updatedAt: string;
}
type ReadingPosition = { book: string; chapter: number };
interface StudyNotesState {
  notes: StudyNote[];
  readingPosition: ReadingPosition;
  addNote: (location: Omit<StudyNote, "id" | "text" | "createdAt" | "updatedAt">) => string;
  updateNote: (id: string, text: string) => void;
  deleteNote: (id: string) => void;
  setReadingPosition: (position: ReadingPosition) => void;
}
export const useStudyNotesStore = create<StudyNotesState>()(
  persist((set) => ({
    notes: [],
    readingPosition: { book: "Genesis", chapter: 1 },
    addNote: (location) => {
      const id = `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timestamp = new Date().toISOString();
      set((state) => ({ notes: [...state.notes, { ...location, id, text: "", createdAt: timestamp, updatedAt: timestamp }] }));
      return id;
    },
    updateNote: (id, text) => set((state) => ({ notes: state.notes.map((note) =>
      note.id === id ? { ...note, text, updatedAt: new Date().toISOString() } : note
    ) })),
    deleteNote: (id) => set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),
    setReadingPosition: (readingPosition) => set({ readingPosition }),
  }), { name: "davar-study-notes-v1", storage: createJSONStorage(() => AsyncStorage) })
);
