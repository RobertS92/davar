export default async function handler(req, res) {
  if (req.method === "GET") {
    const ok = !!(process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY);
    return res.status(ok ? 200 : 503).json({ ok });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const key = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!key) return res.status(503).json({ message: "OpenAI key not configured" });

  // /api/tts vs /api/ai distinguished by query or path — Vercel uses separate files
  return res.status(400).json({ message: "Use /api/ai or /api/tts" });
}
