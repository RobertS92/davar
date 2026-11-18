import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { BIBLE_BOOKS } from "@/types/bible";
import { KJV_BIBLE } from "@/data/kjvBible";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useStudyStore, type NoteScope } from "@/stores/studyStore";
import { cn } from "@/lib/cn";
import { isSignedInUser, useAuthStore } from "@/stores/authStore";

const chaptersFor = (book: string) =>
  Object.keys(KJV_BIBLE[book] ?? {})
    .map(Number)
    .sort((a, b) => a - b);

const SWIPE_THRESHOLD = 56;

export default function BookReaderPage() {
  const { position, notes, saveNote, deleteNote, setPosition, syncStatus } = useStudyStore();
  const user = useAuthStore((s) => s.user);
  const initialSize = usePreferencesStore((s) => s.textSize);
  const [fontSize, setFontSize] = useState(Math.max(16, initialSize));
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState(position.book);
  const [bookQuery, setBookQuery] = useState("");
  const [scope, setScope] = useState<NoteScope>("chapter");
  const [verse, setVerse] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const { book, chapter } = position;
  const bookIndex = BIBLE_BOOKS.indexOf(book);
  const chapters = useMemo(() => chaptersFor(book), [book]);
  const verses = useMemo(
    () =>
      Object.entries(KJV_BIBLE[book]?.[chapter] ?? {})
        .map(([number, text]) => ({ number: Number(number), text: String(text) }))
        .sort((a, b) => a.number - b.number),
    [book, chapter]
  );
  const chapterNotes = notes.filter(
    (n) => !n.deleted && n.book === book && (n.scope === "book" || n.chapter === chapter)
  );
  const shownNotes = chapterNotes.filter(
    (n) => n.scope === scope && (scope !== "verse" || verse === null || n.verse === verse)
  );
  const filteredBooks = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    if (!q) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter((b) => b.toLowerCase().includes(q));
  }, [bookQuery]);

  const canPrev = !(bookIndex <= 0 && chapter <= 1);
  const canNext = !(
    bookIndex >= BIBLE_BOOKS.length - 1 && chapter === chapters[chapters.length - 1]
  );

  const setLocation = (b: string, ch: number) => {
    setPosition(b, ch);
    setVerse(null);
    setPickerOpen(false);
    setDeleteId(null);
  };

  const move = (direction: -1 | 1) => {
    if (direction === -1 && !canPrev) return;
    if (direction === 1 && !canNext) return;
    if (chapters.includes(chapter + direction)) {
      setLocation(book, chapter + direction);
      return;
    }
    const adjacent = BIBLE_BOOKS[bookIndex + direction];
    if (!adjacent) return;
    const available = chaptersFor(adjacent);
    if (available.length) {
      setLocation(adjacent, direction === 1 ? available[0] : available[available.length - 1]);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [book, chapter]);

  const makeNote = () => {
    if (scope === "verse" && verse === null) return;
    saveNote({
      id: crypto.randomUUID(),
      book,
      scope,
      chapter: scope === "book" ? null : chapter,
      verse: scope === "verse" ? verse : null,
      text: "",
      updatedAt: new Date().toISOString(),
    });
  };

  const selectVerse = (number: number) => {
    setVerse(number);
    setScope("verse");
    setPanelOpen(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || panelOpen || pickerOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    // Swipe left → next chapter; swipe right → previous
    move(dx < 0 ? 1 : -1);
  };

  const openPicker = () => {
    setPickerBook(book);
    setBookQuery("");
    setPickerOpen(true);
  };

  const count = chapterNotes.filter((n) => n.text.trim()).length;

  return (
    <div className="flex min-h-dvh flex-col bg-[#17191b] text-[#f2ebdf]">
      <header
        className="safe-top sticky top-0 z-20 border-b border-white/10 bg-[#17191b]/95 backdrop-blur-md"
        style={{ paddingTop: "max(1rem, calc(var(--safe-top) + 0.75rem))" }}
      >
        <div className="flex min-h-[56px] items-center gap-2 px-3 pb-3 md:px-6">
          <Link
            to="/modes"
            aria-label="Back to study modes"
            className="rounded-xl p-2.5 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button
            onClick={openPicker}
            className="min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left hover:bg-white/5"
            aria-label="Select Bible book and chapter"
          >
            <span className="flex items-center gap-1.5 truncate font-display text-xl font-semibold">
              {book} {chapter}
              <ChevronDown className="h-4 w-4 shrink-0 text-[#c7a978]" />
            </span>
            <span className="block text-[11px] uppercase tracking-[.18em] text-neutral-400">
              Tap to choose book & chapter
            </span>
          </button>
          <div className="hidden items-center rounded-xl border border-white/10 sm:flex">
            <button
              className="min-h-10 px-3 text-sm hover:bg-white/10"
              onClick={() => setFontSize(Math.max(16, fontSize - 2))}
              aria-label="Decrease text size"
            >
              A−
            </button>
            <button
              className="min-h-10 px-3 text-lg hover:bg-white/10"
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            aria-pressed={panelOpen}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-[#c7a978]/40 px-3 text-sm text-[#d5b98b] hover:bg-[#c7a978]/10"
          >
            {panelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            <span className="hidden sm:inline">{panelOpen ? "Hide notes" : "Study notes"}</span>
            {count > 0 && <span className="rounded bg-white/10 px-1.5">{count}</span>}
          </button>
        </div>
      </header>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a book and chapter"
        >
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#242528] shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5">
              <div>
                <h2 className="font-display text-2xl">Books & chapters</h2>
                <p className="mt-1 text-sm text-neutral-400">Pick a book, then a chapter</p>
              </div>
              <button onClick={() => setPickerOpen(false)} aria-label="Close selector" className="rounded-xl p-2 hover:bg-white/10">
                <X />
              </button>
            </div>
            <div className="border-b border-white/10 px-4 py-3">
              <input
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                placeholder="Search books (e.g. Psalms, John)"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-neutral-500 focus:border-[#c7a978]"
              />
            </div>
            <div className="overflow-y-auto p-3 pb-8">
              {filteredBooks.map((b) => (
                <section key={b}>
                  <button
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left hover:bg-white/10",
                      b === pickerBook && "bg-white/10 text-[#d5b98b]"
                    )}
                    onClick={() => setPickerBook(b)}
                  >
                    <span>{b}</span>
                    <span className="text-xs text-neutral-400">{chaptersFor(b).length} chapters</span>
                  </button>
                  {pickerBook === b && (
                    <div className="grid grid-cols-6 gap-2 p-3 sm:grid-cols-10">
                      {chaptersFor(b).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => setLocation(b, ch)}
                          className={cn(
                            "min-h-11 rounded-lg border border-white/10 bg-white/5 hover:border-[#c7a978]",
                            b === book && ch === chapter && "border-[#c7a978] bg-[#c7a978]/20"
                          )}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ))}
              {!filteredBooks.length && (
                <p className="px-4 py-8 text-center text-sm text-neutral-400">No books match that search.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main
          ref={scrollRef}
          className={cn(
            "min-w-0 flex-1 overflow-y-auto px-5 pb-28 pt-8 sm:px-10 lg:py-12",
            panelOpen && "hidden lg:block"
          )}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <article className="mx-auto max-w-[760px]">
            <div className="mb-9 text-center">
              <BookOpen className="mx-auto mb-4 h-7 w-7 text-[#c7a978]" />
              <p className="mb-2 text-xs uppercase tracking-[.25em] text-[#c7a978]">{book}</p>
              <h1 className="font-display text-4xl font-semibold">Chapter {chapter}</h1>
              <p className="mt-3 text-xs text-neutral-400">
                Swipe left or right to change chapter · tap a verse for notes
              </p>
            </div>
            {verses.length ? (
              <div className="space-y-2">
                {verses.map(({ number, text }) => {
                  const marked = chapterNotes.some(
                    (n) => n.scope === "verse" && n.verse === number && n.text.trim()
                  );
                  return (
                    <button
                      key={number}
                      onClick={() => selectVerse(number)}
                      aria-label={`Verse ${number}; open study notes`}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[.06]",
                        verse === number && "bg-[#c7a978]/10"
                      )}
                      style={{
                        fontSize,
                        lineHeight: 1.85,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                      }}
                    >
                      <span className="mr-2 align-top font-sans text-sm text-[#c7a978]">{number}</span>
                      {text}
                      {marked && <span className="ml-2 font-sans text-sm text-[#c7a978]">✎</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p role="alert" className="text-center text-neutral-400">
                Scripture text is unavailable for this chapter.
              </p>
            )}
          </article>
        </main>

        {panelOpen && (
          <aside
            aria-label="Study notebook"
            className="flex min-h-0 w-full flex-1 flex-col border-l border-[#c7a978]/15 bg-[#242528] lg:sticky lg:top-[88px] lg:h-[calc(100dvh-88px)] lg:max-w-[420px] lg:flex-none"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="font-display text-2xl">Study notebook</h2>
                <p className="mt-1 text-xs text-neutral-400">
                  {book} {chapter}
                  {scope === "verse" && verse !== null ? ":" + verse : ""}
                </p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                aria-label="Close notes"
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-4" role="tablist" aria-label="Note scope">
              {(["book", "chapter", "verse"] as NoteScope[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={tab === scope}
                  onClick={() => setScope(tab)}
                  className={cn(
                    "min-h-11 rounded-xl bg-white/5 text-sm capitalize",
                    tab === scope && "bg-[#c7a978]/20 text-[#efd2a1] ring-1 ring-[#c7a978]/50"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-28">
              <p className="mb-4 text-xs text-neutral-400">
                {isSignedInUser(user)
                  ? syncStatus === "synced"
                    ? "Notes synced to your account"
                    : syncStatus === "error"
                      ? "Sync unavailable — notes remain on this device"
                      : "Notes saved locally; syncing when connected"
                  : "Guest mode: notes are saved only on this device."}
              </p>
              {shownNotes.map((n) => (
                <div key={n.id} className="mb-4 rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#d5b98b]">
                      {n.scope === "book"
                        ? n.book
                        : `${n.book} ${n.chapter}${n.verse ? ":" + n.verse : ""}`}
                    </p>
                    <button
                      onClick={() => setDeleteId(n.id)}
                      className="rounded-lg p-2 text-neutral-400 hover:text-red-300"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    aria-label="Study note"
                    value={n.text}
                    onChange={(e) =>
                      saveNote({ ...n, text: e.target.value, updatedAt: new Date().toISOString() })
                    }
                    placeholder="Write observations, precepts, and questions…"
                    rows={5}
                    className="min-h-32 w-full resize-y rounded-xl border border-white/10 bg-[#1b1d1f] p-3 text-sm leading-6 text-white outline-none placeholder:text-neutral-500 focus:border-[#c7a978]"
                  />
                  <p className="mt-2 text-xs text-neutral-500">Saved automatically</p>
                  {deleteId === n.id && (
                    <div className="mt-3 rounded-xl border border-red-400/30 p-3 text-sm">
                      <p>Delete this note?</p>
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() => setDeleteId(null)}
                          className="rounded-lg border border-white/20 px-3 py-2"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            deleteNote(n.id);
                            setDeleteId(null);
                          }}
                          className="rounded-lg bg-red-900 px-3 py-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!shownNotes.length && (
                <p className="mb-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-neutral-400">
                  No notes in this {scope} yet.
                </p>
              )}
              <button
                disabled={scope === "verse" && verse === null}
                onClick={makeNote}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#c7a978]/60 text-sm text-[#d5b98b] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Add {scope} note
              </button>
              {scope === "verse" && verse === null && (
                <p className="mt-3 text-xs text-neutral-400">Close notes and tap a Scripture verse first.</p>
              )}
              <div className="mt-6 flex gap-2 sm:hidden">
                <button
                  onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                  className="rounded-lg border border-white/10 px-4 py-2"
                >
                  A−
                </button>
                <button
                  onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                  className="rounded-lg border border-white/10 px-4 py-2"
                >
                  A+
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Always-visible chapter controls */}
      {!panelOpen && (
        <nav
          aria-label="Chapter navigation"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#17191b]/95 backdrop-blur-md"
          style={{ paddingBottom: "max(0.75rem, var(--safe-bottom))" }}
        >
          <div className="mx-auto flex max-w-[760px] items-center gap-2 px-3 pt-2.5">
            <button
              disabled={!canPrev}
              onClick={() => move(-1)}
              className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 text-sm font-medium text-[#d5b98b] disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
              Prev
            </button>
            <button
              onClick={openPicker}
              className="flex min-h-12 flex-[1.4] flex-col items-center justify-center rounded-2xl border border-[#c7a978]/50 bg-[#c7a978]/15 px-2 text-[#efd2a1]"
            >
              <span className="truncate text-sm font-semibold">
                {book} {chapter}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#c7a978]/90">Choose</span>
            </button>
            <button
              disabled={!canNext}
              onClick={() => move(1)}
              className="flex min-h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 text-sm font-medium text-[#d5b98b] disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
