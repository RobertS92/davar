// Bible and Playlist Types

export type Translation = "KJV" | "NIV";

export type ConsumptionMode = "listen" | "read";

export type PlaybackSpeed = 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;

export type PauseStyle = "short" | "medium" | "long";

export type PlaylistMode = "bedtime" | "commute" | "study" | "prayer";

export type PlaylistTone =
  | "comfort"
  | "correction"
  | "wisdom"
  | "faith"
  | "endurance"
  | "repentance"
  | "gratitude";

export type PlaylistScope = "verses" | "chapters" | "books";

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleReference {
  book: string;
  startChapter: number;
  startVerse?: number;
  endChapter?: number;
  endVerse?: number;
  displayReference: string;
}

export interface PlaylistItem {
  id: string;
  reference: BibleReference;
  verses: BibleVerse[];
  title: string;
  text: string;
  estimatedDuration: number; // in seconds
  audioUri?: string;
  isDownloaded?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  items: PlaylistItem[];
  translation: Translation;
  totalDuration: number; // in seconds
  createdAt: string;
  updatedAt: string;
  sourceType: "manual" | "prompt";
  promptUsed?: string;
  tags: string[];
  isFavorite: boolean;
  isDownloaded: boolean;
  lastPlayedAt?: string;
  lastPlayedItemId?: string;
  lastPlayedPosition?: number; // seconds into the item
  completedCount: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female";
  style: string;
}

export interface UserPreferences {
  defaultTranslation: Translation;
  defaultConsumptionMode: ConsumptionMode;
  defaultVoice: string;
  playbackSpeed: PlaybackSpeed;
  pauseStyle: PauseStyle;
  speakVerseNumbers: boolean;
  announceBookChapter: boolean;
  defaultPlaylistLength: number; // minutes
  preferredModes: PlaylistMode[];
  textSize: number;
  nightMode: boolean;
  showVerseNumbersInRead: boolean;
  hasCompletedOnboarding: boolean;
}

export interface PlaylistGenerationOptions {
  targetLength: number; // minutes
  scope: PlaylistScope;
  tones: PlaylistTone[];
  excludeBooks: string[];
  strictLength: boolean;
  orderStyle: "topical" | "narrative";
}

export interface GeneratedPlaylistPlan {
  title: string;
  references: string[];
  explanation: string[];
}

// Book abbreviation mappings
export const BOOK_ABBREVIATIONS: Record<string, string> = {
  "gen": "Genesis",
  "ex": "Exodus",
  "exod": "Exodus",
  "lev": "Leviticus",
  "num": "Numbers",
  "deut": "Deuteronomy",
  "josh": "Joshua",
  "judg": "Judges",
  "ruth": "Ruth",
  "1sam": "1 Samuel",
  "2sam": "2 Samuel",
  "1kgs": "1 Kings",
  "2kgs": "2 Kings",
  "1chr": "1 Chronicles",
  "2chr": "2 Chronicles",
  "ezra": "Ezra",
  "neh": "Nehemiah",
  "esth": "Esther",
  "job": "Job",
  "ps": "Psalms",
  "psa": "Psalms",
  "psalm": "Psalms",
  "prov": "Proverbs",
  "eccl": "Ecclesiastes",
  "song": "Song of Solomon",
  "isa": "Isaiah",
  "jer": "Jeremiah",
  "lam": "Lamentations",
  "ezek": "Ezekiel",
  "dan": "Daniel",
  "hos": "Hosea",
  "joel": "Joel",
  "amos": "Amos",
  "obad": "Obadiah",
  "jonah": "Jonah",
  "mic": "Micah",
  "nah": "Nahum",
  "hab": "Habakkuk",
  "zeph": "Zephaniah",
  "hag": "Haggai",
  "zech": "Zechariah",
  "mal": "Malachi",
  "matt": "Matthew",
  "mt": "Matthew",
  "mk": "Mark",
  "lk": "Luke",
  "jn": "John",
  "acts": "Acts",
  "rom": "Romans",
  "1cor": "1 Corinthians",
  "2cor": "2 Corinthians",
  "gal": "Galatians",
  "eph": "Ephesians",
  "phil": "Philippians",
  "col": "Colossians",
  "1thess": "1 Thessalonians",
  "2thess": "2 Thessalonians",
  "1tim": "1 Timothy",
  "2tim": "2 Timothy",
  "titus": "Titus",
  "phlm": "Philemon",
  "heb": "Hebrews",
  "jas": "James",
  "1pet": "1 Peter",
  "2pet": "2 Peter",
  "1jn": "1 John",
  "2jn": "2 John",
  "3jn": "3 John",
  "jude": "Jude",
  "rev": "Revelation",
};

export const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel",
  "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
  "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus",
  "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation"
];
