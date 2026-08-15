export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const key = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!key) return res.status(503).json({ message: "OpenAI key not configured" });

  try {
    const { messages, temperature, maxTokens, model } = req.body || {};
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens || 2048,
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return res.status(200).json({ content: data.choices?.[0]?.message?.content || "" });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "AI failed" });
  }
}
