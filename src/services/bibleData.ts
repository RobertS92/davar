import { BibleReference, BibleVerse, Translation } from "../types/bible";

// Sample KJV Bible data for common passages
// In a production app, this would come from a local database or API
const KJV_DATA: Record<string, Record<number, Record<number, string>>> = {
  "Psalms": {
    23: {
      1: "The LORD is my shepherd; I shall not want.",
      2: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
      3: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
      4: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
      5: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
      6: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
    },
    91: {
      1: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
      2: "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
      3: "Surely he shall deliver thee from the snare of the fowler, and from the noisome pestilence.",
      4: "He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler.",
      5: "Thou shalt not be afraid for the terror by night; nor for the arrow that flieth by day;",
      6: "Nor for the pestilence that walketh in darkness; nor for the destruction that wasteth at noonday.",
    },
  },
  "John": {
    3: {
      16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      17: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.",
      18: "He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.",
    },
    14: {
      1: "Let not your heart be troubled: ye believe in God, believe also in me.",
      2: "In my Father's house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.",
      3: "And if I go and prepare a place for you, I will come again, and receive you unto myself; that where I am, there ye may be also.",
      6: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
      27: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
    },
  },
  "Romans": {
    8: {
      28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      29: "For whom he did foreknow, he also did predestinate to be conformed to the image of his Son, that he might be the firstborn among many brethren.",
      30: "Moreover whom he did predestinate, them he also called: and whom he called, them he also justified: and whom he justified, them he also glorified.",
      31: "What shall we then say to these things? If God be for us, who can be against us?",
      32: "He that spared not his own Son, but delivered him up for us all, how shall he not with him also freely give us all things?",
      37: "Nay, in all these things we are more than conquerors through him that loved us.",
      38: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
      39: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
    },
  },
  "Philippians": {
    4: {
      4: "Rejoice in the Lord alway: and again I say, Rejoice.",
      5: "Let your moderation be known unto all men. The Lord is at hand.",
      6: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
      7: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
      8: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
      13: "I can do all things through Christ which strengtheneth me.",
    },
  },
  "Isaiah": {
    41: {
      10: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    },
    40: {
      31: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    },
  },
  "Matthew": {
    6: {
      25: "Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on. Is not the life more than meat, and the body than raiment?",
      26: "Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?",
      27: "Which of you by taking thought can add one cubit unto his stature?",
      33: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
      34: "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
    },
    11: {
      28: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
      29: "Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.",
      30: "For my yoke is easy, and my burden is light.",
    },
  },
  "Proverbs": {
    3: {
      5: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
      6: "In all thy ways acknowledge him, and he shall direct thy paths.",
    },
  },
  "James": {
    1: {
      2: "My brethren, count it all joy when ye fall into divers temptations;",
      3: "Knowing this, that the trying of your faith worketh patience.",
      4: "But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.",
      5: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
    },
  },
  "1 Peter": {
    5: {
      7: "Casting all your care upon him; for he careth for you.",
    },
  },
  "Jeremiah": {
    29: {
      11: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
    },
  },
};

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
  const bookData = KJV_DATA[ref.book];

  if (!bookData) {
    // Book not in our sample data - generate placeholder
    return generatePlaceholderVerses(ref);
  }

  // Determine verse range
  const startChapter = ref.startChapter;
  const endChapter = ref.endChapter ?? ref.startChapter;
  const startVerse = ref.startVerse ?? 1;
  const endVerse = ref.endVerse ?? 999; // Large number to get all verses if not specified

  for (let chapter = startChapter; chapter <= endChapter; chapter++) {
    const chapterData = bookData[chapter];
    if (!chapterData) continue;

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
    return generatePlaceholderVerses(ref);
  }

  return verses;
}

/**
 * Generate placeholder verses when actual data is not available
 */
function generatePlaceholderVerses(ref: BibleReference): BibleVerse[] {
  const startVerse = ref.startVerse ?? 1;
  const endVerse = ref.endVerse ?? startVerse + 5;
  const verses: BibleVerse[] = [];

  for (let v = startVerse; v <= endVerse; v++) {
    verses.push({
      book: ref.book,
      chapter: ref.startChapter,
      verse: v,
      text: `[${ref.book} ${ref.startChapter}:${v} - Scripture text will be loaded from the Bible database]`,
    });
  }

  return verses;
}

/**
 * Get available books
 */
export function getAvailableBooks(): string[] {
  return Object.keys(KJV_DATA);
}
