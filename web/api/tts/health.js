export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
  return res.status(key ? 200 : 503).json({ ok: !!key });
}
