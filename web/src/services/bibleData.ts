import type { BibleReference, BibleVerse, Translation } from "@/types/bible";
import { KJV_BIBLE } from "@/data/kjvBible";
import { getBibleApiKey } from "@/lib/api";

function generatePlaceholderVerses(ref: BibleReference): BibleVerse[] {
  const startVerse = ref.startVerse ?? 1;
  const endVerse = ref.endVerse ?? startVerse + 2;
  const verses: BibleVerse[] = [];

  for (let v = startVerse; v <= endVerse; v++) {
    verses.push({
      book: ref.book,
      chapter: ref.startChapter,
      verse: v,
      text: `[${ref.book} ${ref.startChapter}:${v} - This verse is not yet in the database]`,
    });
  }

  return verses;
}

async function fetchNIVVerses(ref: BibleReference): Promise<BibleVerse[]> {
  const apiKey = getBibleApiKey();
  if (!apiKey) throw new Error("Bible API key not configured");

  const bookAbbreviations: Record<string, string> = {
    Genesis: "GEN", Exodus: "EXO", Leviticus: "LEV", Numbers: "NUM",
    Deuteronomy: "DEU", Joshua: "JOS", Judges: "JDG", Ruth: "RUT",
    "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
    "1 Chronicles": "1CH", "2 Chronicles": "2CH", Ezra: "EZR", Nehemiah: "NEH",
    Esther: "EST", Job: "JOB", Psalms: "PSA", Proverbs: "PRO",
    Ecclesiastes: "ECC", "Song of Solomon": "SNG", Isaiah: "ISA",
    Jeremiah: "JER", Lamentations: "LAM", Ezekiel: "EZK", Daniel: "DAN",
    Hosea: "HOS", Joel: "JOL", Amos: "AMO", Obadiah: "OBA",
    Jonah: "JON", Micah: "MIC", Nahum: "NAM", Habakkuk: "HAB",
    Zephaniah: "ZEP", Haggai: "HAG", Zechariah: "ZEC", Malachi: "MAL",
    Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
    Romans: "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", Galatians: "GAL",
    Ephesians: "EPH", Philippians: "PHP", Colossians: "COL",
    "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI",
    "2 Timothy": "2TI", Titus: "TIT", Philemon: "PHM", Hebrews: "HEB",
    James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN",
    "2 John": "2JN", "3 John": "3JN", Jude: "JUD", Revelation: "REV",
  };

  const bookAbbrev = bookAbbreviations[ref.book];
  if (!bookAbbrev) throw new Error(`Unknown book: ${ref.book}`);

  const verses: BibleVerse[] = [];
  const startChapter = ref.startChapter;
  const endChapter = ref.endChapter ?? ref.startChapter;
  const startVerse = ref.startVerse ?? 1;
  const endVerse = ref.endVerse;

  for (let chapter = startChapter; chapter <= endChapter; chapter++) {
    let verseRange = "";
    if (chapter === startChapter && chapter === endChapter && endVerse) {
      verseRange = `${startVerse}-${endVerse}`;
    } else if (chapter === startChapter && startVerse > 1) {
      verseRange = `${startVerse}-999`;
    } else if (chapter === endChapter && endVerse) {
      verseRange = `1-${endVerse}`;
    }

    const passageId = verseRange
      ? `${bookAbbrev}.${chapter}.${verseRange}`
      : `${bookAbbrev}.${chapter}`;

    const response = await fetch(
      `https://api.scripture.api.bible/v1/bibles/de4e12af7f28f599-02/passages/${passageId}?content-type=text&include-verse-numbers=false`,
      { headers: { "api-key": apiKey } }
    );

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const data = await response.json();
    const text = data.data?.content || "";
    const lines = text.split("\n").filter((line: string) => line.trim());
    let verseNum = chapter === startChapter ? startVerse : 1;

    for (const line of lines) {
      if (line.trim()) {
        verses.push({
          book: ref.book,
          chapter,
          verse: verseNum,
          text: line.trim(),
        });
        verseNum++;
      }
    }
  }

  return verses;
}

function getKjvVerses(ref: BibleReference): BibleVerse[] {
  const verses: BibleVerse[] = [];
  const bookData = KJV_BIBLE[ref.book];
  if (!bookData) return generatePlaceholderVerses(ref);

  const startChapter = ref.startChapter;
  const endChapter = ref.endChapter ?? ref.startChapter;
  const startVerse = ref.startVerse ?? 1;
  const endVerse = ref.endVerse ?? 999;

  for (let chapter = startChapter; chapter <= endChapter; chapter++) {
    const chapterData = bookData[chapter];
    if (!chapterData) continue;

    const verseNumbers = Object.keys(chapterData)
      .map(Number)
      .sort((a, b) => a - b);

    for (const verseNum of verseNumbers) {
      if (chapter === startChapter && verseNum < startVerse) continue;
      if (chapter === endChapter && verseNum > endVerse) continue;
      verses.push({
        book: ref.book,
        chapter,
        verse: verseNum,
        text: chapterData[verseNum],
      });
    }
  }

  return verses.length ? verses : generatePlaceholderVerses(ref);
}

export async function getBibleText(
  ref: BibleReference,
  translation: Translation
): Promise<BibleVerse[]> {
  if (translation === "NIV") {
    try {
      return await fetchNIVVerses(ref);
    } catch {
      return getKjvVerses(ref);
    }
  }
  return getKjvVerses(ref);
}
