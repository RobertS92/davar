import {
  BibleReference,
  BOOK_ABBREVIATIONS,
  BIBLE_BOOKS,
} from "../types/bible";

interface ParseResult {
  references: BibleReference[];
  errors: string[];
}

/**
 * Normalize a book name from abbreviations or variations
 */
function normalizeBookName(input: string): string | null {
  const cleaned = input.trim().toLowerCase();

  // Direct match with full name
  const directMatch = BIBLE_BOOKS.find(
    (book) => book.toLowerCase() === cleaned
  );
  if (directMatch) return directMatch;

  // Check abbreviations
  const abbrevMatch = BOOK_ABBREVIATIONS[cleaned];
  if (abbrevMatch) return abbrevMatch;

  // Partial match
  const partialMatch = BIBLE_BOOKS.find((book) =>
    book.toLowerCase().startsWith(cleaned)
  );
  if (partialMatch) return partialMatch;

  return null;
}

/**
 * Parse a single reference string into a BibleReference object
 */
function parseSingleReference(input: string): BibleReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Patterns to match:
  // "John 3:16" - single verse
  // "John 3:16-18" - verse range within chapter
  // "John 3:16-4:2" - range across chapters
  // "Romans 8" - whole chapter
  // "James" - whole book

  // Pattern for book name (handles numbered books like "1 John")
  const bookPattern = /^(\d?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)?)/;
  const bookMatch = trimmed.match(bookPattern);

  if (!bookMatch) return null;

  const bookInput = bookMatch[1].trim();
  const book = normalizeBookName(bookInput);

  if (!book) return null;

  const remainder = trimmed.slice(bookMatch[0].length).trim();

  // If no remainder, it's the whole book
  if (!remainder) {
    return {
      book,
      startChapter: 1,
      displayReference: book,
    };
  }

  // Try to parse chapter:verse patterns
  // Pattern: chapter:startVerse-endVerse or chapter:verse
  const chapterVersePattern = /^(\d+):(\d+)(?:-(\d+))?$/;
  const chapterVerseMatch = remainder.match(chapterVersePattern);

  if (chapterVerseMatch) {
    const chapter = parseInt(chapterVerseMatch[1], 10);
    const startVerse = parseInt(chapterVerseMatch[2], 10);
    const endVerse = chapterVerseMatch[3]
      ? parseInt(chapterVerseMatch[3], 10)
      : startVerse;

    let displayReference = `${book} ${chapter}:${startVerse}`;
    if (endVerse !== startVerse) {
      displayReference += `-${endVerse}`;
    }

    return {
      book,
      startChapter: chapter,
      startVerse,
      endChapter: chapter,
      endVerse,
      displayReference,
    };
  }

  // Pattern: chapter:verse-chapter:verse (cross-chapter range)
  const crossChapterPattern = /^(\d+):(\d+)-(\d+):(\d+)$/;
  const crossChapterMatch = remainder.match(crossChapterPattern);

  if (crossChapterMatch) {
    const startChapter = parseInt(crossChapterMatch[1], 10);
    const startVerse = parseInt(crossChapterMatch[2], 10);
    const endChapter = parseInt(crossChapterMatch[3], 10);
    const endVerse = parseInt(crossChapterMatch[4], 10);

    return {
      book,
      startChapter,
      startVerse,
      endChapter,
      endVerse,
      displayReference: `${book} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`,
    };
  }

  // Pattern: just chapter number
  const chapterPattern = /^(\d+)$/;
  const chapterMatch = remainder.match(chapterPattern);

  if (chapterMatch) {
    const chapter = parseInt(chapterMatch[1], 10);
    return {
      book,
      startChapter: chapter,
      displayReference: `${book} ${chapter}`,
    };
  }

  // Pattern: chapter range (e.g., "1-3")
  const chapterRangePattern = /^(\d+)-(\d+)$/;
  const chapterRangeMatch = remainder.match(chapterRangePattern);

  if (chapterRangeMatch) {
    const startChapter = parseInt(chapterRangeMatch[1], 10);
    const endChapter = parseInt(chapterRangeMatch[2], 10);
    return {
      book,
      startChapter,
      endChapter,
      displayReference: `${book} ${startChapter}-${endChapter}`,
    };
  }

  return null;
}

/**
 * Parse multiple references from input text
 * Supports comma-separated or newline-separated references
 */
export function parseReferences(input: string): ParseResult {
  const references: BibleReference[] = [];
  const errors: string[] = [];

  // Split by newlines and commas
  const lines = input
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const ref = parseSingleReference(line);
    if (ref) {
      references.push(ref);
    } else {
      errors.push(`Could not parse: "${line}"`);
    }
  }

  return { references, errors };
}

/**
 * Validate if a reference exists in the Bible
 * This is a basic validation - a full implementation would check actual chapter/verse counts
 */
export function validateReference(ref: BibleReference): boolean {
  // Check if book is valid
  if (!BIBLE_BOOKS.includes(ref.book)) {
    return false;
  }

  // Basic validation - chapter should be positive
  if (ref.startChapter < 1) {
    return false;
  }

  // Verse should be positive if specified
  if (ref.startVerse !== undefined && ref.startVerse < 1) {
    return false;
  }

  return true;
}
