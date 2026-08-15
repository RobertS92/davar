import { getOpenAITextResponse } from "@/services/aiClient";
import type { GeneratedPlaylistPlan, PlaylistTone, Translation } from "@/types/bible";
import { generatePlaylistPlan as generateCuratedPlan } from "@/services/curatedPlaylists";

interface GenerateOptions {
  prompt: string;
  targetLength: number;
  tones: PlaylistTone[];
  translation: Translation;
}

export async function generatePlaylistWithAI(
  options: GenerateOptions
): Promise<GeneratedPlaylistPlan> {
  const { prompt, targetLength, tones, translation } = options;

  const systemPrompt = `You are a helpful Bible study assistant that creates Scripture playlists.
Your task is to suggest relevant Bible passages based on the user's needs.

Guidelines:
- Select passages that directly address the user's situation or need
- Include a mix of different books when appropriate
- Consider the flow and progression of passages
- Aim for passages that can be read/listened to within the target time
- Use ${translation} translation conventions for references

When selecting passages:
- For comfort: Psalms, Isaiah, John, Romans, Philippians
- For wisdom: Proverbs, Ecclesiastes, James
- For faith: Hebrews, Romans, Mark
- For correction: Proverbs, Galatians, 1 Corinthians
- For endurance: Romans, James, 1 Peter
- For repentance: Psalms, Isaiah, Luke, 1 John
- For gratitude: Psalms, Colossians, 1 Thessalonians

Respond ONLY with valid JSON in this exact format:
{
  "title": "A descriptive title for the playlist",
  "references": ["Book Chapter:Verse-Verse", "Book Chapter", ...],
  "explanation": ["First reason for selection", "Second reason", "Third reason"]
}`;

  const userPrompt = `Create a Scripture playlist for someone who says: "${prompt}"

Target listening time: approximately ${targetLength} minutes
${tones.length > 0 ? `Desired tone(s): ${tones.join(", ")}` : ""}

Suggest appropriate passages and return the JSON response.`;

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
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedPlaylistPlan;
    if (!parsed.title || !Array.isArray(parsed.references) || !Array.isArray(parsed.explanation)) {
      throw new Error("Invalid response structure");
    }
    return parsed;
  } catch {
    return generateCuratedPlan({ prompt, targetLength, tones });
  }
}

export { STATION_REFERENCES, MODE_REFERENCES } from "@/services/curatedPlaylists";
