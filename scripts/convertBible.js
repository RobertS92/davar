/* eslint-disable no-undef */
// Script to convert KJV Bible JSON to our database format
const fs = require('fs');
const path = require('path');

// Book abbreviation to full name mapping
const BOOK_NAMES = {
  "gn": "Genesis",
  "ex": "Exodus",
  "lv": "Leviticus",
  "nm": "Numbers",
  "dt": "Deuteronomy",
  "js": "Joshua",
  "jud": "Judges",
  "rt": "Ruth",
  "1sm": "1 Samuel",
  "2sm": "2 Samuel",
  "1kgs": "1 Kings",
  "2kgs": "2 Kings",
  "1ch": "1 Chronicles",
  "2ch": "2 Chronicles",
  "ezr": "Ezra",
  "ne": "Nehemiah",
  "et": "Esther",
  "job": "Job",
  "ps": "Psalms",
  "prv": "Proverbs",
  "ec": "Ecclesiastes",
  "eccl": "Ecclesiastes",
  "so": "Song of Solomon",
  "is": "Isaiah",
  "jr": "Jeremiah",
  "lm": "Lamentations",
  "ez": "Ezekiel",
  "dn": "Daniel",
  "ho": "Hosea",
  "jl": "Joel",
  "am": "Amos",
  "ob": "Obadiah",
  "jn": "Jonah",
  "mi": "Micah",
  "na": "Nahum",
  "hk": "Habakkuk",
  "zp": "Zephaniah",
  "hg": "Haggai",
  "zc": "Zechariah",
  "ml": "Malachi",
  "mt": "Matthew",
  "mk": "Mark",
  "lk": "Luke",
  "jo": "John",
  "act": "Acts",
  "rm": "Romans",
  "1co": "1 Corinthians",
  "2co": "2 Corinthians",
  "gl": "Galatians",
  "eph": "Ephesians",
  "ph": "Philippians",
  "cl": "Colossians",
  "1ts": "1 Thessalonians",
  "2ts": "2 Thessalonians",
  "1tm": "1 Timothy",
  "2tm": "2 Timothy",
  "tt": "Titus",
  "phm": "Philemon",
  "hb": "Hebrews",
  "jm": "James",
  "1pe": "1 Peter",
  "2pe": "2 Peter",
  "1jo": "1 John",
  "2jo": "2 John",
  "3jo": "3 John",
  "jd": "Jude",
  "re": "Revelation"
};

// Read the raw JSON
const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/kjv_raw.json'), 'utf8'));

// Convert to our format
const kjvBible = {};

rawData.forEach(book => {
  const bookName = BOOK_NAMES[book.abbrev];
  if (!bookName) {
    console.warn(`Unknown abbreviation: ${book.abbrev}`);
    return;
  }

  kjvBible[bookName] = {};

  book.chapters.forEach((chapter, chapterIndex) => {
    const chapterNum = chapterIndex + 1;
    kjvBible[bookName][chapterNum] = {};

    chapter.forEach((verse, verseIndex) => {
      const verseNum = verseIndex + 1;
      // Clean up the verse text - remove Hebrew/Greek annotations in curly braces
      let cleanVerse = verse.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
      kjvBible[bookName][chapterNum][verseNum] = cleanVerse;
    });
  });
});

// Generate TypeScript file with numeric keys
let output = `// KJV Bible Data - Complete 66 books, 1,189 chapters, 31,102 verses
// Auto-generated from public domain KJV Bible text
// Format: { "Book": { chapter: { verse: "text" } } }

export const KJV_BIBLE: Record<string, Record<number, Record<number, string>>> = {\n`;

// Manually build the output to ensure numeric keys
Object.entries(kjvBible).forEach(([bookName, chapters], bookIndex) => {
  output += `  "${bookName}": {\n`;
  Object.entries(chapters).forEach(([chapterNum, verses], chapterIndex) => {
    output += `    ${chapterNum}: {\n`;
    Object.entries(verses).forEach(([verseNum, text], verseIndex) => {
      // Escape quotes in text
      const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const comma = verseIndex < Object.keys(verses).length - 1 ? ',' : '';
      output += `      ${verseNum}: "${escapedText}"${comma}\n`;
    });
    const chapterComma = chapterIndex < Object.keys(chapters).length - 1 ? ',' : '';
    output += `    }${chapterComma}\n`;
  });
  const bookComma = bookIndex < Object.keys(kjvBible).length - 1 ? ',' : '';
  output += `  }${bookComma}\n`;
});

output += '};\n';

// Write the output file
fs.writeFileSync(path.join(__dirname, '../src/data/kjvBible.ts'), output);

console.log('Conversion complete!');
console.log(`Total books: ${Object.keys(kjvBible).length}`);
let totalChapters = 0;
let totalVerses = 0;
Object.values(kjvBible).forEach(book => {
  totalChapters += Object.keys(book).length;
  Object.values(book).forEach(chapter => {
    totalVerses += Object.keys(chapter).length;
  });
});
console.log(`Total chapters: ${totalChapters}`);
console.log(`Total verses: ${totalVerses}`);
