import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { BIBLE_BOOKS } from "../types/bible";
import { getAvailableChapters, getAvailableVerses, getBibleText } from "../services/bibleData";
import { BibleVerse } from "../types/bible";
import { useStudyNotesStore, StudyNote, StudyNoteScope } from "../state/studyNotesStore";
import { usePreferencesStore } from "../state/preferencesStore";

const INK = "#eee7da";
const MUTED = "#a3a099";
const ACCENT = "#c6a978";
const BG = "#151719";
const PAPER = "#202225";

export default function BookReaderScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const split = width >= 760;
  const position = useStudyNotesStore((s) => s.readingPosition);
  const setPosition = useStudyNotesStore((s) => s.setReadingPosition);
  const notes = useStudyNotesStore((s) => s.notes);
  const addNote = useStudyNotesStore((s) => s.addNote);
  const updateNote = useStudyNotesStore((s) => s.updateNote);
  const deleteNote = useStudyNotesStore((s) => s.deleteNote);
  const fontSize = usePreferencesStore((s) => s.textSize);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scope, setScope] = useState<StudyNoteScope>("chapter");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [book, chapter] = [position.book, position.chapter];

  const chapters = useMemo(() => getAvailableChapters(book), [book]);
  const chapterNotes = useMemo(() => notes.filter((n) => n.book === book && (
    n.scope === "book" || (n.chapter === chapter && (n.scope === "chapter" || n.scope === "verse"))
  )), [notes, book, chapter]);
  const shownNotes = useMemo(() => chapterNotes.filter((n) =>
    scope === "book" ? n.scope === "book" :
    scope === "chapter" ? n.scope === "chapter" :
    n.scope === "verse" && (selectedVerse === null || n.verse === selectedVerse)
  ), [chapterNotes, scope, selectedVerse]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    getBibleText({
      book, startChapter: chapter, endChapter: chapter, displayReference: `${book} ${chapter}`
    }, "KJV").then((result) => {
      if (live) setVerses(result.filter((v) => !v.text.startsWith("[")));
    }).catch(() => {
      if (live) setVerses([]);
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [book, chapter]);

  const moveChapter = (step: number) => {
    const bookIndex = BIBLE_BOOKS.indexOf(book);
    const nextChapter = chapter + step;
    if (chapters.includes(nextChapter)) {
      setPosition({ book, chapter: nextChapter });
    } else {
      const nextBook = BIBLE_BOOKS[bookIndex + step];
      if (!nextBook) return;
      const nextChapters = getAvailableChapters(nextBook);
      if (!nextChapters.length) return;
      setPosition({ book: nextBook, chapter: step > 0 ? nextChapters[0] : nextChapters[nextChapters.length - 1] });
    }
    setSelectedVerse(null);
    setEditingId(null);
  };
  const createNote = () => {
    const id = addNote({
      book,
      scope,
      ...(scope === "book" ? {} : { chapter }),
      ...(scope === "verse" ? { verse: selectedVerse ?? getAvailableVerses(book, chapter)[0] ?? 1 } : {}),
    });
    setEditingId(id);
  };
  const selectVerse = (verse: number) => {
    setSelectedVerse(verse);
    setScope("verse");
    setPanelOpen(true);
    setEditingId(null);
  };
  const formatTarget = (n: StudyNote) => n.scope === "book" ? n.book :
    n.scope === "chapter" ? `${n.book} ${n.chapter}` :
    `${n.book} ${n.chapter}:${n.verse}`;
  const hasPrevious = chapter > 1 || BIBLE_BOOKS.indexOf(book) > 0;
  const hasNext = chapter < (chapters[chapters.length - 1] ?? 1) || BIBLE_BOOKS.indexOf(book) < BIBLE_BOOKS.length - 1;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: BG }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 14, borderBottomWidth: 1, borderColor: "#373737" }}>
        <Pressable onPress={() => nav.goBack()} accessibilityLabel="Close book reader"><Ionicons name="arrow-back" size={23} color={INK} /></Pressable>
        <Pressable onPress={() => setPickerOpen(!pickerOpen)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel="Choose Bible book and chapter">
          <Text style={{ color: INK, fontSize: 18, fontWeight: "600" }}>{book} {chapter} <Ionicons name="chevron-down" size={15} color={ACCENT} /></Text>
          <Text style={{ color: MUTED, fontSize: 11 }}>KING JAMES VERSION</Text>
        </Pressable>
        <Pressable onPress={() => setPanelOpen(!panelOpen)} accessibilityLabel={panelOpen ? "Close study notebook" : "Open study notebook"}>
          <Ionicons name={panelOpen ? "reader" : "bookmarks-outline"} size={24} color={ACCENT} />
        </Pressable>
      </View>

      {pickerOpen ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: INK, fontSize: 22, marginBottom: 12 }}>Choose a book</Text>
          {BIBLE_BOOKS.map((b) => (
            <View key={b} style={{ marginBottom: 14 }}>
              <Pressable onPress={() => {
                setPosition({ book: b, chapter: 1 });
                setSelectedVerse(null); setPickerOpen(false);
              }}>
                <Text style={{ color: b === book ? ACCENT : INK, fontSize: 16, paddingVertical: 8 }}>{b}</Text>
              </Pressable>
              {b === book && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {chapters.map((ch) => (
                    <Pressable key={ch} onPress={() => {
                      setPosition({ book: b, chapter: ch }); setSelectedVerse(null); setPickerOpen(false);
                    }} style={{ backgroundColor: ch === chapter ? "#554734" : PAPER, padding: 9, borderRadius: 6, minWidth: 42, alignItems: "center" }}>
                      <Text style={{ color: INK }}>{ch}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, flexDirection: split ? "row" : "column" }}>
          <View style={{ flex: 1, display: !split && panelOpen ? "none" : "flex" }}>
            <ScrollView key={`${book}-${chapter}`} contentContainerStyle={{ paddingHorizontal: width > 900 ? 42 : 24, paddingTop: 30, paddingBottom: 65 }}>
              <Text style={{ color: ACCENT, fontSize: 13, letterSpacing: 2, textAlign: "center" }}>{book.toUpperCase()}</Text>
              <Text style={{ color: INK, fontSize: 32, fontWeight: "600", marginBottom: 26, marginTop: 8, textAlign: "center" }}>Chapter {chapter}</Text>
              {loading ? <Text style={{ color: MUTED }}>Loading Scripture…</Text> :
                verses.length === 0 ? <Text style={{ color: MUTED }}>This chapter is unavailable in the local Bible dataset.</Text> :
                verses.map((v) => {
                  const marked = chapterNotes.some((n) => n.scope === "verse" && n.verse === v.verse && n.text.trim());
                  return <Pressable key={v.verse} onPress={() => selectVerse(v.verse)}
                    accessibilityLabel={`Verse ${v.verse}. Tap to open notes`}
                    style={{ marginBottom: 14, padding: 5, borderRadius: 6, backgroundColor: selectedVerse === v.verse ? "#34312b" : "transparent" }}>
                    <Text style={{ color: INK, fontSize, lineHeight: fontSize * 1.75 }}>
                      <Text style={{ color: ACCENT, fontSize: Math.max(12, fontSize - 4) }}>{v.verse} </Text>{v.text}
                      {marked ? <Text style={{ color: ACCENT }}>  ✎</Text> : null}
                    </Text>
                  </Pressable>;
                })
              }
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 18, borderTopWidth: 1, borderColor: "#373737" }}>
              <Pressable disabled={!hasPrevious} onPress={() => moveChapter(-1)}><Text style={{ color: hasPrevious ? ACCENT : MUTED }}>‹ Previous</Text></Pressable>
              <Text style={{ color: MUTED }}>{book} {chapter}</Text>
              <Pressable disabled={!hasNext} onPress={() => moveChapter(1)}><Text style={{ color: hasNext ? ACCENT : MUTED }}>Next ›</Text></Pressable>
            </View>
          </View>
          {panelOpen && (
            <View style={{ width: split ? Math.min(400, width * .42) : "100%", flex: split ? undefined : 1, borderLeftWidth: split ? 1 : 0, borderColor: "#3b3832", backgroundColor: PAPER }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, alignItems: "center" }}>
                <Text style={{ color: INK, fontSize: 19, fontWeight: "600" }}>Study Notebook</Text>
                {!split && <Pressable onPress={() => setPanelOpen(false)} accessibilityLabel="Return to Bible"><Ionicons name="close" color={INK} size={24} /></Pressable>}
              </View>
              <View style={{ flexDirection: "row", paddingHorizontal: 12, gap: 6, marginBottom: 16 }}>
                {(["book", "chapter", "verse"] as StudyNoteScope[]).map((tab) => (
                  <Pressable key={tab} onPress={() => { setScope(tab); setEditingId(null); }}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: "center", backgroundColor: scope === tab ? "#514632" : "#303235" }}>
                    <Text style={{ color: INK, textTransform: "capitalize", fontSize: 12 }}>{tab}</Text>
                  </Pressable>
                ))}
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 14, paddingBottom: 60 }}>
                <Text style={{ color: MUTED, marginBottom: 10 }}>
                  {scope === "book" ? book : scope === "chapter" ? `${book} ${chapter}` : `${book} ${chapter}:${selectedVerse ?? "select a verse"}`}
                </Text>
                {shownNotes.map((n) => (
                  <View key={n.id} style={{ backgroundColor: "#2e3033", padding: 12, borderRadius: 10, marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: ACCENT, fontSize: 12 }}>{formatTarget(n)}</Text>
                      <Pressable onPress={() => deleteNote(n.id)} accessibilityLabel="Delete note"><Ionicons name="trash-outline" color={MUTED} size={18} /></Pressable>
                    </View>
                    <TextInput multiline value={n.text} onFocus={() => setEditingId(n.id)}
                      onChangeText={(text) => updateNote(n.id, text)}
                      placeholder="Write your observations, questions, or precepts…"
                      placeholderTextColor="#777"
                      textAlignVertical="top"
                      style={{ color: INK, fontSize: 15, minHeight: editingId === n.id ? 130 : 72, lineHeight: 23 }} />
                    <Text style={{ color: MUTED, fontSize: 11, marginTop: 8 }}>Saved locally as you type</Text>
                  </View>
                ))}
                {shownNotes.length === 0 && <Text style={{ color: MUTED, marginBottom: 18 }}>No notes here yet.</Text>}
                <Pressable onPress={createNote} style={{ borderColor: ACCENT, borderWidth: 1, borderRadius: 8, padding: 13, alignItems: "center" }}>
                  <Text style={{ color: ACCENT }}>+ Add {scope} note</Text>
                </Pressable>
                {scope === "verse" && selectedVerse === null && <Text style={{ color: MUTED, marginTop: 10, fontSize: 12 }}>Tap a verse in the Bible to target it precisely.</Text>}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
