import { getOpenAITextResponse } from "../api/chat-service";
import { Translation, GeneratedPlaylistPlan } from "../types/bible";

export type DeepDiveType = "precepts" | "story" | "chapters" | "book" | "mixed";

export type DeepDiveTopic =
  | "faith"
  | "salvation"
  | "holiness"
  | "wisdom"
  | "prayer"
  | "spiritual_warfare"
  | "love"
  | "kingdom"
  | "obedience"
  | "suffering"
  | "identity"
  | "promises"
  | "stewardship";

interface DeepDiveOptions {
  topic: DeepDiveTopic;
  type: DeepDiveType;
  duration: number;
  translation: Translation;
  customFocus?: string;
}

const topicGuidance: Record<DeepDiveTopic, { books: string[]; themes: string[]; stories: string[] }> = {
  faith: {
    books: ["Hebrews", "Romans", "Genesis", "James"],
    themes: ["trusting God", "faith without works is dead", "walking by faith", "faith heroes"],
    stories: ["Abraham and Isaac", "David and Goliath", "Daniel in the lions den", "Shadrach Meshach Abednego", "Joshua entering the promised land"],
  },
  salvation: {
    books: ["Romans", "Ephesians", "John", "Acts"],
    themes: ["justification by faith", "grace", "redemption", "new birth", "forgiveness of sins"],
    stories: ["The prodigal son", "Nicodemus", "The woman at the well", "The thief on the cross", "Paul conversion"],
  },
  holiness: {
    books: ["Leviticus", "1 Peter", "Hebrews", "1 John"],
    themes: ["set apart", "purity", "sanctification", "fleeing sin", "walking in the Spirit"],
    stories: ["Joseph fleeing Potiphar wife", "Daniel refusing the king food", "The golden calf"],
  },
  wisdom: {
    books: ["Proverbs", "Ecclesiastes", "James", "Job"],
    themes: ["fear of the Lord", "discernment", "wise counsel", "avoiding folly", "understanding"],
    stories: ["Solomon asking for wisdom", "The wise and foolish builders", "The ten virgins"],
  },
  prayer: {
    books: ["Psalms", "Matthew", "Luke", "Daniel"],
    themes: ["intercession", "worship", "petition", "thanksgiving", "persistence in prayer"],
    stories: ["Hannah prayer", "Elijah on Mount Carmel", "Jesus in Gethsemane", "Daniel praying three times daily"],
  },
  spiritual_warfare: {
    books: ["Ephesians", "2 Corinthians", "1 Peter", "Revelation"],
    themes: ["armor of God", "standing firm", "resisting the devil", "victory in Christ", "spiritual weapons"],
    stories: ["Jesus temptation", "David and Goliath", "Elisha and the army of angels", "Job trial"],
  },
  love: {
    books: ["1 Corinthians", "1 John", "John", "Song of Solomon"],
    themes: ["agape love", "love of enemies", "God first loved us", "love fulfills the law", "sacrificial love"],
    stories: ["The good Samaritan", "Jesus washing disciples feet", "Ruth and Naomi", "Hosea and Gomer"],
  },
  kingdom: {
    books: ["Matthew", "Mark", "Luke", "Daniel"],
    themes: ["kingdom parables", "seek first the kingdom", "kingdom values", "the King returns"],
    stories: ["Parable of the sower", "The mustard seed", "The pearl of great price", "The wedding feast"],
  },
  obedience: {
    books: ["Deuteronomy", "Joshua", "James", "John"],
    themes: ["blessings of obedience", "if you love me keep my commands", "hearers and doers", "walking in His ways"],
    stories: ["Abraham leaving Ur", "Noah building the ark", "Moses at the burning bush", "Mary saying yes"],
  },
  suffering: {
    books: ["Job", "1 Peter", "Romans", "2 Corinthians"],
    themes: ["purpose in pain", "perseverance", "comfort in affliction", "glory through suffering", "hope"],
    stories: ["Job trials", "Joseph in prison", "Paul thorn in the flesh", "Jesus suffering"],
  },
  identity: {
    books: ["Ephesians", "Colossians", "Romans", "1 Peter"],
    themes: ["new creation", "chosen", "adopted", "royal priesthood", "seated with Christ"],
    stories: ["Gideon called mighty warrior", "Peter renamed", "Jacob becomes Israel"],
  },
  promises: {
    books: ["Genesis", "Isaiah", "Hebrews", "2 Peter"],
    themes: ["covenant promises", "God is faithful", "standing on the Word", "exceedingly great promises"],
    stories: ["Rainbow covenant", "Abraham and the stars", "Joshua crossing Jordan", "Elijah and the ravens"],
  },
  stewardship: {
    books: ["Proverbs", "Matthew", "Luke", "1 Timothy"],
    themes: ["faithful stewardship", "generosity", "contentment", "eternal treasure", "tithing", "managing resources"],
    stories: ["Parable of the talents", "The rich young ruler", "The widow's mite", "Joseph managing Egypt", "Zacchaeus"],
  },
};

function getTypeInstructions(type: DeepDiveType, duration: number): string {
  const passageCount = Math.ceil(duration / 3); // Roughly 3 min per passage average

  switch (type) {
    case "precepts":
      return `Focus on key verses and teachings (precepts). Include ${passageCount - 5} to ${passageCount} individual verses or short verse ranges (2-4 verses each) that teach key principles on this topic. Group related verses together logically.`;
    case "story":
      return `Focus on narrative passages that tell stories. Include ${Math.ceil(passageCount / 4)} to ${Math.ceil(passageCount / 2)} story passages, using chapter ranges (e.g., "Genesis 22:1-19", "Daniel 3", "Luke 15:11-32"). Stories should illustrate the theme powerfully.`;
    case "chapters":
      return `Focus on full chapter studies. Include ${Math.ceil(passageCount / 6)} to ${Math.ceil(passageCount / 4)} full chapters that deeply explore this topic. Reference entire chapters like "Romans 8", "Hebrews 11", "Psalm 23", "John 17".`;
    case "book":
      return `Focus on an extended study through a single book or major section. Select one primary book and include key chapters from it (e.g., if studying wisdom, include "Proverbs 1", "Proverbs 2", "Proverbs 3", "Proverbs 8", "Proverbs 31"). You may add 2-3 supporting passages from other books.`;
    case "mixed":
    default:
      return `Create a mixed study with variety:
- Include 3-5 key precept verses (individual verses or short ranges)
- Include 2-3 story passages (chapter ranges showing narrative)
- Include 2-4 full chapters for deep study
This creates a rich, varied study experience covering the topic from multiple angles.`;
  }
}

export async function generateDeepDivePlaylist(
  options: DeepDiveOptions
): Promise<GeneratedPlaylistPlan> {
  const { topic, type, duration, translation, customFocus } = options;
  const guidance = topicGuidance[topic];

  const systemPrompt = `You are an expert Bible study curriculum designer creating a ${duration}-minute deep dive study session.

Your task is to create a comprehensive Scripture playlist for extended study on the topic of "${topic}".

IMPORTANT GUIDELINES:
1. This is a LONG study session (${duration} minutes), so include substantial content
2. Use ${translation} translation reference conventions
3. ${getTypeInstructions(type, duration)}

REFERENCE BOOKS for ${topic}:
- Primary: ${guidance.books.slice(0, 2).join(", ")}
- Supporting: ${guidance.books.slice(2).join(", ")}

KEY THEMES to cover: ${guidance.themes.join(", ")}

RELEVANT STORIES: ${guidance.stories.join(", ")}

FORMAT REQUIREMENTS:
- Use proper Bible reference format: "Book Chapter:Verse-Verse" or "Book Chapter" or "Book Chapter:Verse"
- For chapter ranges use: "Book Chapter-Chapter" (e.g., "Romans 8-10")
- Order passages logically for a cohesive study flow
- Consider starting with foundational passages and building to deeper ones

${customFocus ? `CUSTOM FOCUS FROM USER: ${customFocus}` : ""}

Respond ONLY with valid JSON:
{
  "title": "A compelling, specific title for this deep dive study",
  "references": ["Reference 1", "Reference 2", ...],
  "explanation": ["Point 1 explaining the study flow", "Point 2", "Point 3", "Point 4"]
}`;

  const userPrompt = `Create a ${duration}-minute deep dive study on "${topic}" using the "${type}" format.

The study should be comprehensive enough to fill ${duration} minutes of listening/reading time.

Return the JSON response with:
1. A specific, engaging title
2. Scripture references in proper format
3. 4-5 explanation points describing the study flow and key takeaways`;

  try {
    const response = await getOpenAITextResponse(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7 }
    );

    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedPlaylistPlan;

    if (!parsed.title || !Array.isArray(parsed.references) || !Array.isArray(parsed.explanation)) {
      throw new Error("Invalid response structure");
    }

    return parsed;
  } catch (error) {
    console.log("Deep dive generation error:", error);

    // Return a fallback based on topic
    return getFallbackPlaylist(topic, type, duration);
  }
}

function getFallbackPlaylist(topic: DeepDiveTopic, type: DeepDiveType, duration: number): GeneratedPlaylistPlan {
  const fallbacks: Record<DeepDiveTopic, GeneratedPlaylistPlan> = {
    faith: {
      title: "The Journey of Faith: From Genesis to Hebrews",
      references: [
        "Hebrews 11:1-6",
        "Genesis 12:1-9",
        "Genesis 15",
        "Genesis 22:1-19",
        "Romans 4:1-25",
        "Romans 10:17",
        "Hebrews 11:8-22",
        "Hebrews 11:23-40",
        "James 2:14-26",
        "Mark 11:22-24",
        "Matthew 17:14-21",
        "2 Corinthians 5:7",
      ],
      explanation: [
        "Begins with the definition of faith in Hebrews 11",
        "Traces Abraham journey as the father of faith",
        "Explores how faith is demonstrated through action",
        "Concludes with practical teachings on living by faith",
      ],
    },
    salvation: {
      title: "The Gospel: God's Plan of Redemption",
      references: [
        "Romans 3:9-26",
        "Romans 5:1-11",
        "Romans 6:1-14",
        "Romans 8:1-17",
        "John 3:1-21",
        "Ephesians 2:1-10",
        "Titus 3:3-7",
        "Acts 2:37-41",
        "Luke 15:11-32",
        "Isaiah 53",
      ],
      explanation: [
        "Establishes the universal need for salvation through Romans",
        "Reveals God's grace through Christ's sacrifice",
        "Shows the transformation that comes with new life",
        "Includes powerful stories of redemption",
      ],
    },
    holiness: {
      title: "Called to Holiness: Living Set Apart",
      references: [
        "1 Peter 1:13-25",
        "1 Peter 2:9-12",
        "Leviticus 19:1-18",
        "Leviticus 20:7-8",
        "Romans 12:1-2",
        "2 Corinthians 6:14-7:1",
        "Hebrews 12:14-17",
        "1 John 2:15-17",
        "1 Thessalonians 4:1-8",
        "Psalm 24",
        "Genesis 39",
      ],
      explanation: [
        "Defines what it means to be holy as God is holy",
        "Provides practical commands for holy living",
        "Explores the call to be separate from the world",
        "Illustrates holiness through Joseph example",
      ],
    },
    wisdom: {
      title: "Walking in Wisdom: The Path of Understanding",
      references: [
        "Proverbs 1:1-7",
        "Proverbs 2",
        "Proverbs 3:1-18",
        "Proverbs 4",
        "Proverbs 8",
        "Proverbs 9:1-12",
        "James 1:5-8",
        "James 3:13-18",
        "1 Kings 3:5-14",
        "Ecclesiastes 12:9-14",
      ],
      explanation: [
        "Begins with the fear of the Lord as wisdom foundation",
        "Explores wisdom personified in Proverbs 8",
        "Contrasts godly wisdom with earthly wisdom",
        "Shows Solomon seeking and receiving wisdom",
      ],
    },
    prayer: {
      title: "The School of Prayer: Learning from Scripture",
      references: [
        "Matthew 6:5-15",
        "Luke 11:1-13",
        "Luke 18:1-14",
        "Psalm 51",
        "Psalm 63",
        "Daniel 9:1-19",
        "1 Samuel 1:9-20",
        "James 5:13-18",
        "Philippians 4:6-7",
        "John 17",
        "1 Kings 18:30-40",
      ],
      explanation: [
        "Teaches the model prayer from Jesus",
        "Explores persistence and humility in prayer",
        "Includes powerful examples of answered prayer",
        "Studies Jesus high priestly prayer in John 17",
      ],
    },
    spiritual_warfare: {
      title: "Standing Firm: Victory in Spiritual Battle",
      references: [
        "Ephesians 6:10-20",
        "2 Corinthians 10:3-6",
        "1 Peter 5:6-11",
        "James 4:7-10",
        "Matthew 4:1-11",
        "2 Kings 6:8-23",
        "Daniel 10:1-21",
        "Revelation 12:7-12",
        "Romans 8:31-39",
        "2 Chronicles 20:1-30",
      ],
      explanation: [
        "Equips with the full armor of God",
        "Reveals the nature of spiritual warfare",
        "Shows Jesus defeating temptation with Scripture",
        "Demonstrates victory through worship and faith",
      ],
    },
    love: {
      title: "The Greatest of These: Understanding God's Love",
      references: [
        "1 Corinthians 13",
        "1 John 4:7-21",
        "John 3:16-21",
        "John 15:9-17",
        "Romans 5:6-11",
        "Romans 8:35-39",
        "Ephesians 3:14-21",
        "Luke 10:25-37",
        "John 13:1-17",
        "Hosea 3",
        "Ruth 1:15-18",
      ],
      explanation: [
        "Defines love through 1 Corinthians 13",
        "Explores the depth of God's love for us",
        "Shows love demonstrated through action",
        "Illustrates sacrificial love through stories",
      ],
    },
    kingdom: {
      title: "The Kingdom of God: His Reign and Rule",
      references: [
        "Matthew 13:1-23",
        "Matthew 13:24-52",
        "Matthew 5:1-16",
        "Matthew 6:25-34",
        "Mark 1:14-15",
        "Luke 17:20-37",
        "John 18:33-37",
        "Daniel 2:31-45",
        "Daniel 7:13-14",
        "Revelation 11:15-19",
      ],
      explanation: [
        "Introduces the kingdom through Jesus parables",
        "Teaches kingdom values from the Sermon on the Mount",
        "Traces the kingdom from Daniel prophecies to Revelation",
        "Reveals Jesus as the coming King",
      ],
    },
    obedience: {
      title: "Walking in Obedience: The Path of Blessing",
      references: [
        "Deuteronomy 28:1-14",
        "Deuteronomy 30:11-20",
        "Joshua 1:1-9",
        "John 14:15-24",
        "John 15:10-14",
        "James 1:22-27",
        "1 Samuel 15:1-23",
        "Genesis 6:9-22",
        "Genesis 12:1-9",
        "Luke 1:26-38",
        "Acts 5:27-32",
      ],
      explanation: [
        "Establishes the blessings of obedience from Deuteronomy",
        "Links love and obedience through Jesus words",
        "Contrasts obedience and disobedience through Saul",
        "Shows heroes of faith who obeyed God's call",
      ],
    },
    suffering: {
      title: "Purpose in the Pain: God's Perspective on Suffering",
      references: [
        "Job 1:1-22",
        "Job 2:1-10",
        "Job 38:1-18",
        "Job 42:1-17",
        "Romans 5:1-5",
        "Romans 8:18-30",
        "2 Corinthians 1:3-11",
        "2 Corinthians 4:7-18",
        "2 Corinthians 12:7-10",
        "1 Peter 4:12-19",
        "James 1:2-12",
        "Hebrews 12:1-13",
      ],
      explanation: [
        "Walks through Job's journey of suffering and restoration",
        "Reveals how suffering produces character and hope",
        "Shows Paul's perspective on weakness and grace",
        "Provides practical encouragement for trials",
      ],
    },
    identity: {
      title: "Who You Are in Christ: Your New Identity",
      references: [
        "Ephesians 1:3-14",
        "Ephesians 2:1-10",
        "Ephesians 2:19-22",
        "Colossians 3:1-17",
        "Romans 8:14-17",
        "1 Peter 2:4-10",
        "2 Corinthians 5:14-21",
        "Galatians 2:20",
        "John 1:12-13",
        "Galatians 3:26-29",
        "Judges 6:11-24",
      ],
      explanation: [
        "Reveals every spiritual blessing in Christ",
        "Establishes your identity as God's chosen people",
        "Transforms self-image through Scripture",
        "Shows Gideon discovering his true identity",
      ],
    },
    promises: {
      title: "Standing on the Promises: God's Faithful Word",
      references: [
        "2 Peter 1:3-11",
        "Hebrews 6:13-20",
        "Genesis 9:8-17",
        "Genesis 15:1-6",
        "Genesis 17:1-8",
        "Isaiah 41:10-13",
        "Isaiah 43:1-7",
        "Jeremiah 29:10-14",
        "Romans 4:18-25",
        "Joshua 21:43-45",
        "Joshua 23:14",
        "2 Corinthians 1:20",
      ],
      explanation: [
        "Establishes the precious promises given to believers",
        "Traces God's covenant promises through Scripture",
        "Shows how Abraham believed God's promises",
        "Confirms that all God's promises are Yes in Christ",
      ],
    },
    stewardship: {
      title: "Faithful Stewardship: Managing God's Resources",
      references: [
        "Matthew 25:14-30",
        "Luke 16:1-13",
        "Luke 12:13-21",
        "Luke 21:1-4",
        "Malachi 3:8-12",
        "Proverbs 3:9-10",
        "Proverbs 11:24-25",
        "1 Timothy 6:6-19",
        "2 Corinthians 9:6-15",
        "Matthew 6:19-24",
        "Genesis 41:33-49",
        "Luke 19:1-10",
      ],
      explanation: [
        "Teaches faithful stewardship through the parable of the talents",
        "Reveals the dangers of greed and love of money",
        "Shows principles of generous and cheerful giving",
        "Illustrates wise management through Joseph in Egypt",
      ],
    },
  };

  return fallbacks[topic] || fallbacks.faith;
}
