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
 * Normalize hyphens - replace en-dash, em-dash with regular hyphen
 */
function normalizeHyphens(input: string): string {
  return input.replace(/[–—]/g, "-");
}

/**
 * Parse a single reference string into a BibleReference object
 */
function parseSingleReference(input: string): BibleReference | null {
  // Normalize hyphens first
  const trimmed = normalizeHyphens(input.trim());
  if (!trimmed) return null;

  // Pattern for book name (handles numbered books like "1 John", "1 Thessalonians")
  const bookPattern = /^(\d?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)*)/;
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
 * Split input intelligently, handling comma-separated verses within a reference
 * e.g., "Psalm 119:9, 11" should become two refs, but "Romans 8, Psalm 23" should also work
 */
function smartSplit(input: string): string[] {
  const results: string[] = [];

  // Normalize hyphens first
  const normalized = normalizeHyphens(input);

  // Split by newlines first
  const lines = normalized.split(/\n/).map(line => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Split by comma
    const parts = line.split(",").map(p => p.trim()).filter(Boolean);

    let currentBook = "";
    let currentChapter = "";

    for (const part of parts) {
      // Check if this part starts with a book name
      const bookPattern = /^(\d?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)*)/;
      const bookMatch = part.match(bookPattern);

      if (bookMatch) {
        const potentialBook = normalizeBookName(bookMatch[1].trim());
        if (potentialBook) {
          // This is a new book reference
          currentBook = potentialBook;
          const remainder = part.slice(bookMatch[0].length).trim();

          // Check if there's a chapter
          const chapterMatch = remainder.match(/^(\d+)/);
          if (chapterMatch) {
            currentChapter = chapterMatch[1];
          } else {
            currentChapter = "";
          }

          results.push(part);
          continue;
        }
      }

      // If it's just a number or verse reference, it might be continuing the previous reference
      const justNumberPattern = /^(\d+)$/;
      const justVersePattern = /^(\d+):(\d+)(?:-(\d+))?$/;
      const justVerseNumPattern = /^(\d+)(?:-(\d+))?$/;

      if (currentBook && currentChapter) {
        // Check if it's just a verse number (continuing same chapter)
        if (justVerseNumPattern.test(part) && !justNumberPattern.test(part.split("-")[0]) === false) {
          // It's a verse or verse range in the same chapter
          if (part.includes(":")) {
            results.push(`${currentBook} ${part}`);
          } else {
            results.push(`${currentBook} ${currentChapter}:${part}`);
          }
          continue;
        }
      }

      if (currentBook && justNumberPattern.test(part)) {
        // Could be a chapter number for the same book
        const num = parseInt(part, 10);
        if (num < 200) { // Reasonable chapter/verse number
          if (currentChapter) {
            // Assume it's a verse in the same chapter
            results.push(`${currentBook} ${currentChapter}:${part}`);
          } else {
            // Assume it's a new chapter
            results.push(`${currentBook} ${part}`);
            currentChapter = part;
          }
          continue;
        }
      }

      // Otherwise, just add as-is
      results.push(part);
    }
  }

  return results;
}

/**
 * Parse multiple references from input text
 * Supports comma-separated or newline-separated references
 * Handles complex patterns like "Psalm 119:9, 11" and "Psalm 37:1-10, 23"
 */
export function parseReferences(input: string): ParseResult {
  const references: BibleReference[] = [];
  const errors: string[] = [];

  // Use smart split to handle complex comma usage
  const parts = smartSplit(input);

  for (const part of parts) {
    const ref = parseSingleReference(part);
    if (ref) {
      references.push(ref);
    } else {
      errors.push(`Could not parse: "${part}"`);
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
