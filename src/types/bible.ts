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
  "genesis": "Genesis",
  "ex": "Exodus",
  "exod": "Exodus",
  "exodus": "Exodus",
  "lev": "Leviticus",
  "leviticus": "Leviticus",
  "num": "Numbers",
  "numbers": "Numbers",
  "deut": "Deuteronomy",
  "deuteronomy": "Deuteronomy",
  "josh": "Joshua",
  "joshua": "Joshua",
  "judg": "Judges",
  "judges": "Judges",
  "ruth": "Ruth",
  "1sam": "1 Samuel",
  "1 sam": "1 Samuel",
  "1 samuel": "1 Samuel",
  "2sam": "2 Samuel",
  "2 sam": "2 Samuel",
  "2 samuel": "2 Samuel",
  "1kgs": "1 Kings",
  "1 kings": "1 Kings",
  "2kgs": "2 Kings",
  "2 kings": "2 Kings",
  "1chr": "1 Chronicles",
  "1 chronicles": "1 Chronicles",
  "2chr": "2 Chronicles",
  "2 chronicles": "2 Chronicles",
  "ezra": "Ezra",
  "neh": "Nehemiah",
  "nehemiah": "Nehemiah",
  "esth": "Esther",
  "esther": "Esther",
  "job": "Job",
  "ps": "Psalms",
  "psa": "Psalms",
  "psalm": "Psalms",
  "psalms": "Psalms",
  "prov": "Proverbs",
  "proverbs": "Proverbs",
  "eccl": "Ecclesiastes",
  "ecclesiastes": "Ecclesiastes",
  "song": "Song of Solomon",
  "song of solomon": "Song of Solomon",
  "isa": "Isaiah",
  "isaiah": "Isaiah",
  "jer": "Jeremiah",
  "jeremiah": "Jeremiah",
  "lam": "Lamentations",
  "lamentations": "Lamentations",
  "ezek": "Ezekiel",
  "ezekiel": "Ezekiel",
  "dan": "Daniel",
  "daniel": "Daniel",
  "hos": "Hosea",
  "hosea": "Hosea",
  "joel": "Joel",
  "amos": "Amos",
  "obad": "Obadiah",
  "obadiah": "Obadiah",
  "jonah": "Jonah",
  "mic": "Micah",
  "micah": "Micah",
  "nah": "Nahum",
  "nahum": "Nahum",
  "hab": "Habakkuk",
  "habakkuk": "Habakkuk",
  "zeph": "Zephaniah",
  "zephaniah": "Zephaniah",
  "hag": "Haggai",
  "haggai": "Haggai",
  "zech": "Zechariah",
  "zechariah": "Zechariah",
  "mal": "Malachi",
  "malachi": "Malachi",
  "matt": "Matthew",
  "matthew": "Matthew",
  "mt": "Matthew",
  "mk": "Mark",
  "mark": "Mark",
  "lk": "Luke",
  "luke": "Luke",
  "jn": "John",
  "john": "John",
  "acts": "Acts",
  "rom": "Romans",
  "romans": "Romans",
  "1cor": "1 Corinthians",
  "1 cor": "1 Corinthians",
  "1 corinthians": "1 Corinthians",
  "2cor": "2 Corinthians",
  "2 cor": "2 Corinthians",
  "2 corinthians": "2 Corinthians",
  "gal": "Galatians",
  "galatians": "Galatians",
  "eph": "Ephesians",
  "ephesians": "Ephesians",
  "phil": "Philippians",
  "philippians": "Philippians",
  "col": "Colossians",
  "colossians": "Colossians",
  "1thess": "1 Thessalonians",
  "1 thess": "1 Thessalonians",
  "1 thessalonians": "1 Thessalonians",
  "2thess": "2 Thessalonians",
  "2 thess": "2 Thessalonians",
  "2 thessalonians": "2 Thessalonians",
  "1tim": "1 Timothy",
  "1 tim": "1 Timothy",
  "1 timothy": "1 Timothy",
  "2tim": "2 Timothy",
  "2 tim": "2 Timothy",
  "2 timothy": "2 Timothy",
  "titus": "Titus",
  "phlm": "Philemon",
  "philemon": "Philemon",
  "heb": "Hebrews",
  "hebrews": "Hebrews",
  "jas": "James",
  "james": "James",
  "1pet": "1 Peter",
  "1 pet": "1 Peter",
  "1 peter": "1 Peter",
  "2pet": "2 Peter",
  "2 pet": "2 Peter",
  "2 peter": "2 Peter",
  "1jn": "1 John",
  "1 jn": "1 John",
  "1 john": "1 John",
  "2jn": "2 John",
  "2 jn": "2 John",
  "2 john": "2 John",
  "3jn": "3 John",
  "3 jn": "3 John",
  "3 john": "3 John",
  "jude": "Jude",
  "rev": "Revelation",
  "revelation": "Revelation",
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
