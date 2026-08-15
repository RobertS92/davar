import { postJson } from "@/lib/api";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export async function getOpenAITextResponse(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<{ content: string }> {
  const data = await postJson<{ content: string }>("/api/ai", {
    messages,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 2048,
    model: options?.model,
  });
  return data;
}
