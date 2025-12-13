import { BibleReference, BibleVerse, Translation } from "../types/bible";
import { KJV_BIBLE } from "../data/kjvBible";

/**
 * Get Bible verses for a reference
 */
export async function getBibleText(
  ref: BibleReference,
  translation: Translation
): Promise<BibleVerse[]> {
  // For MVP, we only support KJV with local data
  // NIV would require an external API call

  if (translation === "NIV") {
    // For NIV, we would call an external API
    // For now, fall back to KJV with a note
    console.log("NIV not yet implemented, using KJV");
  }

  const verses: BibleVerse[] = [];
  const bookData = KJV_BIBLE[ref.book];

  if (!bookData) {
    // Book not in our data - generate placeholder
    console.log(`Book "${ref.book}" not found in Bible data`);
    return generatePlaceholderVerses(ref);
  }

  // Determine verse range
  const startChapter = ref.startChapter;
  const endChapter = ref.endChapter ?? ref.startChapter;
  const startVerse = ref.startVerse ?? 1;
  const endVerse = ref.endVerse ?? 999; // Large number to get all verses if not specified

  for (let chapter = startChapter; chapter <= endChapter; chapter++) {
    const chapterData = bookData[chapter];
    if (!chapterData) {
      console.log(`Chapter ${chapter} not found in ${ref.book}`);
      continue;
    }

    const verseNumbers = Object.keys(chapterData)
      .map(Number)
      .sort((a, b) => a - b);

    for (const verseNum of verseNumbers) {
      // Check if verse is in range
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
    console.log(`No verses found for ${ref.displayReference}`);
    return generatePlaceholderVerses(ref);
  }

  return verses;
}

/**
 * Generate placeholder verses when actual data is not available
 */
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

/**
 * Get available books
 */
export function getAvailableBooks(): string[] {
  return Object.keys(KJV_BIBLE);
}

/**
 * Check if a book exists in the database
 */
export function hasBook(bookName: string): boolean {
  return bookName in KJV_BIBLE;
}

/**
 * Get chapters available for a book
 */
export function getAvailableChapters(bookName: string): number[] {
  const book = KJV_BIBLE[bookName];
  if (!book) return [];
  return Object.keys(book).map(Number).sort((a, b) => a - b);
}

/**
 * Get verses available for a chapter
 */
export function getAvailableVerses(bookName: string, chapter: number): number[] {
  const book = KJV_BIBLE[bookName];
  if (!book) return [];
  const chapterData = book[chapter];
  if (!chapterData) return [];
  return Object.keys(chapterData).map(Number).sort((a, b) => a - b);
}
