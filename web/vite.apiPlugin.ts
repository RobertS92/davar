import type { Plugin } from "vite";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvKeys(root: string): Record<string, string> {
  const keys: Record<string, string> = { ...process.env } as Record<string, string>;
  for (const file of [".env", "web/.env", "backend/.env"]) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      keys[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return keys;
}

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function davarApiPlugin(workspaceRoot: string): Plugin {
  return {
    name: "davar-api",
    configureServer(server) {
      const env = loadEnvKeys(workspaceRoot);
      const openaiKey =
        env.OPENAI_API_KEY ||
        env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY ||
        env.VITE_OPENAI_API_KEY;

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        try {
          if (req.url === "/api/tts/health" && req.method === "GET") {
            res.statusCode = openaiKey ? 200 : 503;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: !!openaiKey }));
            return;
          }

          if (req.url === "/api/ai" && req.method === "POST") {
            if (!openaiKey) {
              res.statusCode = 503;
              res.end(JSON.stringify({ message: "OpenAI key not configured" }));
              return;
            }
            const body = JSON.parse(await readBody(req));
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: body.model || "gpt-4o",
                messages: body.messages,
                temperature: body.temperature ?? 0.7,
                max_tokens: body.maxTokens || 2048,
              }),
            });
            const data = await response.json();
            if (!response.ok) {
              res.statusCode = response.status;
              res.end(JSON.stringify(data));
              return;
            }
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                content: data.choices?.[0]?.message?.content || "",
              })
            );
            return;
          }

          if (req.url === "/api/tts" && req.method === "POST") {
            if (!openaiKey) {
              res.statusCode = 503;
              res.end("OpenAI key not configured");
              return;
            }
            const body = JSON.parse(await readBody(req));
            const response = await fetch("https://api.openai.com/v1/audio/speech", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "tts-1",
                voice: body.voice || "nova",
                input: body.text,
                speed: body.speed || 1,
              }),
            });
            if (!response.ok) {
              res.statusCode = response.status;
              res.end(await response.text());
              return;
            }
            const buf = Buffer.from(await response.arrayBuffer());
            res.setHeader("Content-Type", "audio/mpeg");
            res.end(buf);
            return;
          }

          if (req.url === "/api/analytics/events" && req.method === "POST") {
            // Dev: accept and no-op (backend persists in production)
            await readBody(req);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
            return;
          }
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ message: error instanceof Error ? error.message : "API error" }));
          return;
        }

        next();
      });
    },
  };
}
