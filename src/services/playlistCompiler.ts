import { v4 as uuidv4 } from "uuid";
import {
  BibleReference,
  BibleVerse,
  Playlist,
  PlaylistItem,
  Translation,
} from "../types/bible";
import { getBibleText } from "./bibleData";

// Estimate reading speed: ~150 words per minute for natural speech
const WORDS_PER_MINUTE = 150;

/**
 * Calculate estimated duration for text in seconds
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const minutes = wordCount / WORDS_PER_MINUTE;
  return Math.ceil(minutes * 60);
}

/**
 * Chunk verses into reasonable playlist items
 * Aims for 4-10 verses per item, or paragraph-based when available
 */
function chunkVerses(verses: BibleVerse[]): BibleVerse[][] {
  const chunks: BibleVerse[][] = [];
  const targetChunkSize = 6;

  for (let i = 0; i < verses.length; i += targetChunkSize) {
    chunks.push(verses.slice(i, i + targetChunkSize));
  }

  return chunks;
}

/**
 * Create a playlist item from verses
 */
function createPlaylistItem(
  verses: BibleVerse[],
  reference: BibleReference
): PlaylistItem {
  const text = verses.map((v) => v.text).join(" ");

  // Generate title from first and last verse
  const firstVerse = verses[0];
  const lastVerse = verses[verses.length - 1];

  let title = `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`;
  if (verses.length > 1) {
    if (firstVerse.chapter === lastVerse.chapter) {
      title = `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`;
    } else {
      title = `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.chapter}:${lastVerse.verse}`;
    }
  }

  return {
    id: uuidv4(),
    reference: {
      ...reference,
      displayReference: title,
    },
    verses,
    title,
    text,
    estimatedDuration: estimateDuration(text),
  };
}

interface CompileOptions {
  title: string;
  references: BibleReference[];
  translation: Translation;
  sourceType: "manual" | "prompt";
  promptUsed?: string;
  tags?: string[];
}

/**
 * Compile a playlist from references
 */
export async function compilePlaylist(options: CompileOptions): Promise<Playlist> {
  const { title, references, translation, sourceType, promptUsed, tags = [] } = options;

  const items: PlaylistItem[] = [];

  for (const ref of references) {
    // Get verses for this reference
    const verses = await getBibleText(ref, translation);

    if (verses.length === 0) {
      continue;
    }

    // Chunk verses into manageable items
    const chunks = chunkVerses(verses);

    for (const chunk of chunks) {
      items.push(createPlaylistItem(chunk, ref));
    }
  }

  const totalDuration = items.reduce((sum, item) => sum + item.estimatedDuration, 0);

  return {
    id: uuidv4(),
    title,
    items,
    translation,
    totalDuration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceType,
    promptUsed,
    tags,
    isFavorite: false,
    isDownloaded: false,
    completedCount: 0,
  };
}
