import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Plus, Trash2, X } from "lucide-react";
import { BIBLE_BOOKS } from "@/types/bible";
import { KJV_BIBLE } from "@/data/kjvBible";
import { usePreferencesStore } from "@/stores/preferencesStore";
import { useStudyStore, type NoteScope, type StudyNote } from "@/stores/studyStore";
import { cn } from "@/lib/cn";
import { isSignedInUser, useAuthStore } from "@/stores/authStore";

const chaptersFor = (book: string) => Object.keys(KJV_BIBLE[book] ?? {}).map(Number).sort((a,b) => a - b);

export default function BookReaderPage() {
  const { position, notes, saveNote, deleteNote, setPosition, syncStatus } = useStudyStore();
  const user = useAuthStore((s) => s.user);
  const initialSize = usePreferencesStore((s) => s.textSize);
  const [fontSize, setFontSize] = useState(Math.max(16, initialSize));
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState(position.book);
  const [scope, setScope] = useState<NoteScope>("chapter");
  const [verse, setVerse] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { book, chapter } = position;
  const bookIndex = BIBLE_BOOKS.indexOf(book);
  const chapters = useMemo(() => chaptersFor(book), [book]);
  const verses = useMemo(() => Object.entries(KJV_BIBLE[book]?.[chapter] ?? {}).map(([number, text]) => ({ number: Number(number), text: String(text) })).sort((a,b) => a.number - b.number), [book, chapter]);
  const chapterNotes = notes.filter((n) => !n.deleted && n.book === book && (n.scope === "book" || n.chapter === chapter));
  const shownNotes = chapterNotes.filter((n) => n.scope === scope && (scope !== "verse" || verse === null || n.verse === verse));
  const setLocation = (b: string, ch: number) => { setPosition(b, ch); setVerse(null); setPickerOpen(false); setDeleteId(null); };
  const move = (direction: -1 | 1) => {
    if (chapters.includes(chapter + direction)) return setLocation(book, chapter + direction);
    const adjacent = BIBLE_BOOKS[bookIndex + direction];
    if (!adjacent) return;
    const available = chaptersFor(adjacent);
    if (available.length) setLocation(adjacent, direction === 1 ? available[0] : available[available.length - 1]);
  };
  const makeNote = () => {
    if (scope === "verse" && verse === null) return;
    saveNote({
      id: crypto.randomUUID(), book, scope, chapter: scope === "book" ? null : chapter,
      verse: scope === "verse" ? verse : null, text: "", updatedAt: new Date().toISOString()
    });
  };
  const selectVerse = (number: number) => { setVerse(number); setScope("verse"); setPanelOpen(true); };
  const count = chapterNotes.filter((n) => n.text.trim()).length;
  return (
    <div className="flex min-h-dvh flex-col bg-[#17191b] text-[#f2ebdf]">
      <header className="sticky top-0 z-20 flex min-h-[72px] items-center gap-3 border-b border-white/10 bg-[#17191b]/95 px-4 py-3 backdrop-blur-md md:px-7">
        <Link to="/modes" aria-label="Back to study modes" className="rounded-xl p-2 hover:bg-white/10"><ArrowLeft className="h-5 w-5"/></Link>
        <button onClick={() => { setPickerBook(book); setPickerOpen(true); }} className="min-w-0 flex-1 rounded-xl px-2 py-1 text-left hover:bg-white/5" aria-label="Select Bible book and chapter">
          <span className="block truncate font-display text-xl font-semibold">{book} {chapter} <span className="text-[#c7a978]">⌄</span></span>
          <span className="block text-[11px] uppercase tracking-[.18em] text-neutral-400">King James Version</span>
        </button>
        <div className="hidden items-center rounded-xl border border-white/10 sm:flex">
          <button className="min-h-10 px-3 text-sm hover:bg-white/10" onClick={() => setFontSize(Math.max(16,fontSize-2))} aria-label="Decrease text size">A−</button>
          <button className="min-h-10 px-3 text-lg hover:bg-white/10" onClick={() => setFontSize(Math.min(32,fontSize+2))} aria-label="Increase text size">A+</button>
        </div>
        <button onClick={() => setPanelOpen(!panelOpen)} aria-pressed={panelOpen} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#c7a978]/40 px-3 text-sm text-[#d5b98b] hover:bg-[#c7a978]/10">
          {panelOpen ? <PanelRightClose className="h-5 w-5"/> : <PanelRightOpen className="h-5 w-5"/>}
          <span className="hidden sm:inline">{panelOpen ? "Hide notes" : "Study notes"}</span>{count > 0 && <span className="rounded bg-white/10 px-1.5">{count}</span>}
        </button>
      </header>
      {pickerOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" role="dialog" aria-modal="true" aria-label="Choose a book and chapter">
        <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#242528] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 p-5"><h2 className="font-display text-2xl">Books & chapters</h2><button onClick={() => setPickerOpen(false)} aria-label="Close selector"><X/></button></div>
          <div className="overflow-y-auto p-4">
            {BIBLE_BOOKS.map((b) => <section key={b}>
              <button className={cn("flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left hover:bg-white/10", b === pickerBook && "bg-white/10 text-[#d5b98b]")} onClick={() => setPickerBook(b)}>
                <span>{b}</span><span className="text-xs text-neutral-400">{chaptersFor(b).length} chapters</span>
              </button>
              {pickerBook === b && <div className="grid grid-cols-6 gap-2 p-3 sm:grid-cols-10">{chaptersFor(b).map((ch) =>
                <button key={ch} onClick={() => setLocation(b,ch)} className={cn("min-h-11 rounded-lg border border-white/10 bg-white/5 hover:border-[#c7a978]", b === book && ch === chapter && "border-[#c7a978] bg-[#c7a978]/20")}>{ch}</button>
              )}</div>}
            </section>)}
          </div>
        </div>
      </div>}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className={cn("min-w-0 flex-1 px-5 py-8 sm:px-10 lg:py-12", panelOpen && "hidden lg:block")}>
          <article className="mx-auto max-w-[760px]">
            <div className="mb-9 text-center">
              <BookOpen className="mx-auto mb-4 h-7 w-7 text-[#c7a978]"/>
              <p className="mb-2 text-xs uppercase tracking-[.25em] text-[#c7a978]">{book}</p>
              <h1 className="font-display text-4xl font-semibold">Chapter {chapter}</h1>
              <p className="mt-3 text-xs text-neutral-400">Select a verse to attach your study notes</p>
            </div>
            {verses.length ? <div className="space-y-2">{verses.map(({number,text}) => {
              const marked = chapterNotes.some((n) => n.scope === "verse" && n.verse === number && n.text.trim());
              return <button key={number} onClick={() => selectVerse(number)} aria-label={`Verse ${number}; open study notes`}
                className={cn("block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[.06]", verse === number && "bg-[#c7a978]/10")}
                style={{fontSize, lineHeight: 1.85, fontFamily: "Georgia, 'Times New Roman', serif"}}>
                <span className="mr-2 align-top font-sans text-sm text-[#c7a978]">{number}</span>{text}{marked && <span className="ml-2 font-sans text-sm text-[#c7a978]">✎</span>}
              </button>;
            })}</div> : <p role="alert" className="text-center text-neutral-400">Scripture text is unavailable for this chapter.</p>}
            <nav aria-label="Chapter navigation" className="mt-12 flex items-center justify-between border-t border-white/10 pt-6">
              <button disabled={bookIndex === 0 && chapter === 1} onClick={() => move(-1)} className="flex min-h-11 items-center gap-1 text-[#d5b98b] disabled:opacity-30"><ChevronLeft className="h-5 w-5"/> Previous</button>
              <span className="text-sm text-neutral-400">{book} {chapter}</span>
              <button disabled={bookIndex === BIBLE_BOOKS.length - 1 && chapter === chapters[chapters.length - 1]} onClick={() => move(1)} className="flex min-h-11 items-center gap-1 text-[#d5b98b] disabled:opacity-30">Next <ChevronRight className="h-5 w-5"/></button>
            </nav>
          </article>
        </main>
        {panelOpen && <aside aria-label="Study notebook" className="flex min-h-0 w-full flex-1 flex-col border-l border-[#c7a978]/15 bg-[#242528] lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:max-w-[420px] lg:flex-none">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div><h2 className="font-display text-2xl">Study notebook</h2><p className="mt-1 text-xs text-neutral-400">{book} {chapter}{scope === "verse" && verse !== null ? ":" + verse : ""}</p></div>
            <button onClick={() => setPanelOpen(false)} aria-label="Close notes" className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5"/></button>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 py-4" role="tablist" aria-label="Note scope">
            {(["book","chapter","verse"] as NoteScope[]).map((tab) => <button key={tab} role="tab" aria-selected={tab === scope} onClick={() => setScope(tab)}
              className={cn("min-h-11 rounded-xl bg-white/5 text-sm capitalize", tab === scope && "bg-[#c7a978]/20 text-[#efd2a1] ring-1 ring-[#c7a978]/50")}>{tab}</button>)}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-12">
            <p className="mb-4 text-xs text-neutral-400">{isSignedInUser(user) ? (syncStatus === "synced" ? "Notes synced to your account" : syncStatus === "error" ? "Sync unavailable — notes remain on this device" : "Notes saved locally; syncing when connected") : "Guest mode: notes are saved only on this device."}</p>
            {shownNotes.map((n) => <div key={n.id} className="mb-4 rounded-2xl border border-white/10 bg-black/10 p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#d5b98b]">{n.scope === "book" ? n.book : `${n.book} ${n.chapter}${n.verse ? ":"+n.verse : ""}`}</p>
                <button onClick={() => setDeleteId(n.id)} className="rounded-lg p-2 text-neutral-400 hover:text-red-300" aria-label="Delete note"><Trash2 className="h-4 w-4"/></button>
              </div>
              <textarea aria-label="Study note" value={n.text} onChange={(e) => saveNote({ ...n, text: e.target.value, updatedAt: new Date().toISOString() })}
                placeholder="Write observations, precepts, and questions…" rows={5}
                className="min-h-32 w-full resize-y rounded-xl border border-white/10 bg-[#1b1d1f] p-3 text-sm leading-6 text-white outline-none placeholder:text-neutral-500 focus:border-[#c7a978]"/>
              <p className="mt-2 text-xs text-neutral-500">Saved automatically</p>
              {deleteId === n.id && <div className="mt-3 rounded-xl border border-red-400/30 p-3 text-sm"><p>Delete this note?</p>
                <div className="mt-3 flex gap-3"><button onClick={() => setDeleteId(null)} className="rounded-lg border border-white/20 px-3 py-2">Cancel</button><button onClick={() => { deleteNote(n.id); setDeleteId(null); }} className="rounded-lg bg-red-900 px-3 py-2">Delete</button></div>
              </div>}
            </div>)}
            {!shownNotes.length && <p className="mb-6 rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-neutral-400">No notes in this {scope} yet.</p>}
            <button disabled={scope === "verse" && verse === null} onClick={makeNote} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#c7a978]/60 text-sm text-[#d5b98b] disabled:opacity-40"><Plus className="h-4 w-4"/> Add {scope} note</button>
            {scope === "verse" && verse === null && <p className="mt-3 text-xs text-neutral-400">Close notes and tap a Scripture verse first.</p>}
            <div className="mt-6 flex gap-2 sm:hidden">
              <button onClick={() => setFontSize(Math.max(16,fontSize-2))} className="rounded-lg border border-white/10 px-4 py-2">A−</button>
              <button onClick={() => setFontSize(Math.min(32,fontSize+2))} className="rounded-lg border border-white/10 px-4 py-2">A+</button>
            </div>
          </div>
        </aside>}
      </div>
    </div>
  );
}
