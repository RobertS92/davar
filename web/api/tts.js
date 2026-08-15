export default async function handler(req, res) {
  if (req.method === "GET" && req.url?.includes("health")) {
    const ok = !!(process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY);
    return res.status(ok ? 200 : 503).json({ ok });
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const key = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  if (!key) return res.status(503).send("OpenAI key not configured");

  try {
    const { text, voice, speed } = req.body || {};
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: voice || "nova",
        input: text,
        speed: speed || 1,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).send(await response.text());
    }

    const buf = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    return res.status(200).send(buf);
  } catch (error) {
    return res.status(500).send(error instanceof Error ? error.message : "TTS failed");
  }
}
