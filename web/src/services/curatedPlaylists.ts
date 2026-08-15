import type { GeneratedPlaylistPlan, PlaylistTone } from "@/types/bible";

interface TopicPack {
  keywords: string[];
  title: string;
  references: string[];
  explanation: string[];
  tones?: PlaylistTone[];
}

const TOPIC_PACKS: TopicPack[] = [
  {
    keywords: ["peace", "anxiety", "worry", "rest", "calm", "bedtime", "sleep"],
    title: "Peace for Anxious Hearts",
    references: ["Psalm 23", "Philippians 4:6-9", "Isaiah 26:3-4", "John 14:27", "Matthew 11:28-30", "Psalm 4:8"],
    explanation: [
      "Passages that settle the heart and mind",
      "Promises of Gods nearness in worry",
      "Restful words for evening reflection",
    ],
    tones: ["comfort"],
  },
  {
    keywords: ["faith", "trust", "believe", "doubt"],
    title: "Walking by Faith",
    references: ["Hebrews 11:1-16", "Romans 4:18-25", "Mark 9:23-24", "Proverbs 3:5-6", "2 Corinthians 5:7", "James 1:2-8"],
    explanation: [
      "Classic teachings on trust",
      "Stories and counsel for believing God",
      "Practical encouragement for doubt",
    ],
    tones: ["faith"],
  },
  {
    keywords: ["strength", "overcome", "victory", "warfare", "temptation", "lust", "purity"],
    title: "Strength to Overcome",
    references: ["Ephesians 6:10-18", "Romans 8:31-39", "1 Corinthians 10:12-13", "James 4:7-8", "Psalm 119:9-16", "Galatians 5:16-25"],
    explanation: [
      "Armor and promises for spiritual battle",
      "Counsel for resisting temptation",
      "Hope rooted in Christs victory",
    ],
    tones: ["endurance"],
  },
  {
    keywords: ["wisdom", "work", "money", "steward", "decision", "guidance"],
    title: "Wisdom for the Path",
    references: ["Proverbs 3", "James 1:5-8", "Colossians 3:23-24", "Matthew 6:19-34", "Ecclesiastes 3:1-8", "Psalm 1"],
    explanation: [
      "Practical wisdom for daily choices",
      "A biblical view of work and resources",
      "Guidance for seeking the Lord first",
    ],
    tones: ["wisdom"],
  },
  {
    keywords: ["love", "marriage", "family", "father", "mother", "spouse"],
    title: "Love That Endures",
    references: ["1 Corinthians 13", "Ephesians 5:21-33", "Colossians 3:12-21", "Proverbs 31:10-31", "Song of Solomon 2:10-13", "1 John 4:7-12"],
    explanation: [
      "Covenant love and household wisdom",
      "Christlike care in close relationships",
      "Encouragement for family life",
    ],
    tones: ["gratitude"],
  },
  {
    keywords: ["prayer", "worship", "praise", "meditat"],
    title: "Prayers from Scripture",
    references: ["Matthew 6:9-13", "Psalm 51", "Psalm 103", "Daniel 9:4-10", "John 17:1-26", "Philippians 1:9-11"],
    explanation: [
      "Model prayers from Jesus and the saints",
      "Psalms for worship and repentance",
      "Words to pray when you have none",
    ],
    tones: ["gratitude"],
  },
  {
    keywords: ["messiah", "jesus", "gospel", "cross", "resurrection"],
    title: "The Messiah",
    references: ["Isaiah 53", "Luke 2:1-20", "Matthew 5:1-12", "John 1:1-18", "Mark 15:33-39", "Luke 24:1-12", "Revelation 1:12-18"],
    explanation: [
      "Prophecy and birth of the Messiah",
      "Teachings, cross, and empty tomb",
      "The risen Christ revealed",
    ],
  },
  {
    keywords: ["commute", "journey", "go", "drive"],
    title: "Scripture for the Road",
    references: ["Psalm 121", "Romans 8:28-39", "Joshua 1:7-9", "Isaiah 40:28-31", "Philippians 3:7-14", "Psalm 91"],
    explanation: [
      "Steadying words for travel and transition",
      "Strength and purpose for the day",
      "Promises that travel well out loud",
    ],
  },
  {
    keywords: ["study", "doctrine", "teach", "learn"],
    title: "Deep Study Passages",
    references: ["Romans 8", "John 15", "Ephesians 1", "Hebrews 4:12-16", "2 Timothy 3:14-17", "Psalm 119:97-105"],
    explanation: [
      "Dense, teachable chapters",
      "Truths worth slow reading",
      "Fuel for meditation and memory",
    ],
  },
];

const DEFAULT_PLAN: GeneratedPlaylistPlan = {
  title: "Scripture for Your Journey",
  references: ["Psalm 23", "Philippians 4:6-7", "Romans 8:28-39", "Isaiah 41:10", "Matthew 11:28-30"],
  explanation: [
    "Classic passages of comfort and peace",
    "Encouragement during difficult times",
    "Reminders of Gods faithful love",
  ],
};

export interface GenerateOptions {
  prompt: string;
  targetLength: number;
  tones: PlaylistTone[];
}

export async function generatePlaylistPlan(options: GenerateOptions): Promise<GeneratedPlaylistPlan> {
  const prompt = options.prompt.toLowerCase();

  let best: TopicPack | null = null;
  let bestScore = 0;

  for (const pack of TOPIC_PACKS) {
    let score = pack.keywords.reduce((sum, key) => (prompt.includes(key) ? sum + 2 : sum), 0);
    if (options.tones.length && pack.tones) {
      score += options.tones.filter((t) => pack.tones?.includes(t)).length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = pack;
    }
  }

  if (!best || bestScore === 0) {
    return DEFAULT_PLAN;
  }

  // Trim or expand reference list roughly by target length
  const count = Math.max(4, Math.min(best.references.length, Math.round(options.targetLength / 4)));
  return {
    title: best.title,
    references: best.references.slice(0, count),
    explanation: best.explanation,
  };
}

export const STATION_REFERENCES: Record<string, { title: string; references: string[]; tags: string[] }> = {
  messiah: {
    title: "The Messiah",
    tags: ["messiah", "jesus", "gospel"],
    references: ["Isaiah 9:6-7", "Luke 2:1-20", "Matthew 5:1-12", "John 10:7-18", "Mark 15:22-39", "Luke 24:1-12", "Revelation 5:6-14"],
  },
  kings: {
    title: "The Kings",
    tags: ["david", "solomon", "kings"],
    references: ["1 Samuel 16:1-13", "1 Samuel 17:32-50", "2 Samuel 7:8-16", "Psalm 51", "1 Kings 3:5-14", "Proverbs 3:1-12", "Ecclesiastes 12:9-14"],
  },
  "famous-stories": {
    title: "Famous Stories",
    tags: ["stories", "heroes", "faith"],
    references: ["Genesis 22:1-18", "Exodus 14:13-31", "Joshua 6:1-20", "Judges 7:1-22", "Daniel 3:13-28", "Daniel 6:16-23", "Jonah 1:1-17"],
  },
  stewardship: {
    title: "Stewardship",
    tags: ["stewardship", "money", "generosity"],
    references: ["Matthew 25:14-30", "Luke 21:1-4", "Proverbs 3:9-10", "2 Corinthians 9:6-11", "1 Timothy 6:6-19", "Malachi 3:8-12"],
  },
  faith: {
    title: "Faith",
    tags: ["faith", "trust", "belief"],
    references: ["Hebrews 11:1-16", "Romans 5:1-5", "Mark 11:22-24", "James 2:14-26", "Habakkuk 2:2-4", "John 20:24-29"],
  },
  lust: {
    title: "Overcoming Lust",
    tags: ["purity", "self-control", "overcoming"],
    references: ["Matthew 5:27-30", "1 Corinthians 6:18-20", "Galatians 5:16-25", "Job 31:1", "Psalm 119:9-11", "2 Timothy 2:22"],
  },
  overcoming: {
    title: "Overcoming",
    tags: ["victory", "strength", "perseverance"],
    references: ["Romans 8:31-39", "Ephesians 6:10-18", "1 John 5:1-5", "Revelation 12:10-11", "Psalm 27", "Isaiah 41:10"],
  },
  obedience: {
    title: "Obedience",
    tags: ["obedience", "commandments", "discipleship"],
    references: ["Deuteronomy 6:4-9", "Joshua 1:7-9", "John 14:15-24", "James 1:22-25", "1 Samuel 15:22-23", "Matthew 7:24-27"],
  },
  "narrow-path": {
    title: "The Narrow Path",
    tags: ["discipleship", "commitment", "holiness"],
    references: ["Matthew 7:13-14", "Luke 9:23-26", "Luke 14:25-33", "Philippians 3:7-14", "Romans 12:1-2", "Hebrews 12:1-3"],
  },
  fatherhood: {
    title: "Fatherhood",
    tags: ["fatherhood", "family", "leadership"],
    references: ["Ephesians 6:1-4", "Proverbs 4:1-13", "Deuteronomy 6:4-9", "Psalm 103:8-13", "Luke 15:11-24", "Joshua 24:14-15"],
  },
  motherhood: {
    title: "Motherhood",
    tags: ["motherhood", "family", "wisdom"],
    references: ["Proverbs 31:10-31", "1 Samuel 1:9-28", "Luke 1:46-55", "Titus 2:3-5", "Psalm 127", "Isaiah 66:12-13"],
  },
  marriage: {
    title: "Marriage",
    tags: ["marriage", "love", "covenant"],
    references: ["Genesis 2:18-24", "Ephesians 5:21-33", "1 Corinthians 13", "Colossians 3:12-19", "Song of Solomon 8:6-7", "Ecclesiastes 4:9-12"],
  },
  work: {
    title: "Work",
    tags: ["work", "diligence", "integrity"],
    references: ["Colossians 3:22-24", "Proverbs 6:6-11", "Ecclesiastes 9:10", "Ephesians 4:28", "Matthew 25:14-23", "Psalm 90:12-17"],
  },
};

export const MODE_REFERENCES: Record<string, { title: string; references: string[]; tags: string[] }> = {
  bedtime: {
    title: "Bedtime Peace",
    tags: ["bedtime", "peace", "rest"],
    references: ["Psalm 4", "Psalm 23", "Psalm 91", "Isaiah 26:3-4", "John 14:1-3", "Philippians 4:6-7"],
  },
  commute: {
    title: "Commute Strength",
    tags: ["commute", "strength", "guidance"],
    references: ["Psalm 121", "Joshua 1:7-9", "Isaiah 40:28-31", "Romans 8:28-39", "Proverbs 3:5-6", "Psalm 46"],
  },
  study: {
    title: "Study Focus",
    tags: ["study", "wisdom", "doctrine"],
    references: ["Psalm 119:97-105", "2 Timothy 3:14-17", "Romans 8:1-17", "John 15:1-11", "Hebrews 4:12-16", "James 1:19-25"],
  },
  prayer: {
    title: "Prayer Loop",
    tags: ["prayer", "worship", "meditation"],
    references: ["Matthew 6:9-13", "Psalm 51", "Psalm 103", "Daniel 9:4-19", "John 17:20-26", "Ephesians 3:14-21"],
  },
};
