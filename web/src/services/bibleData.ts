import type { BibleReference, BibleVerse, Translation } from "@/types/bible";
import { KJV_BIBLE } from "@/data/kjvBible";

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

export async function getBibleText(
  ref: BibleReference,
  _translation: Translation
): Promise<BibleVerse[]> {
  const verses: BibleVerse[] = [];
  const bookData = KJV_BIBLE[ref.book];

  if (!bookData) {
    return generatePlaceholderVerses(ref);
  }

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

  if (verses.length === 0) {
    return generatePlaceholderVerses(ref);
  }

  return verses;
}
