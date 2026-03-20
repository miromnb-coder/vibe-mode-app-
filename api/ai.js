const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

function extractFirstJsonObject(text = "") {
  const s = String(text);
  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") depth--;

    if (depth === 0) {
      return s.slice(start, i + 1);
    }
  }

  return null;
}

function normalizeFiles(files = {}) {
  const out = {};
  for (const [name, content] of Object.entries(files || {})) {
    if (Array.isArray(content)) {
      out[name] = content.map((line) => String(line)).join("\n");
    } else {
      out[name] = String(content ?? "");
    }
  }
  return out;
}

function normalizeResponse(obj) {
  if (!obj || typeof obj !== "object") {
    return { type: "chat", text: "No response" };
  }

  if (obj.type === "project") {
    return {
      type: "project",
      title: String(obj.title || "Untitled App"),
      summary: String(obj.summary || "Generated app"),
      files: normalizeFiles(obj.files || {}),
    };
  }

  if (obj.type === "chat") {
    return {
      type: "chat",
      text: String(obj.text || obj.reply || "No response"),
    };
  }

  return { type: "chat", text: "No response" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { prompt, memory = [] } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ type: "chat", text: "No prompt provided" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ type: "chat", text: "Missing GROQ_API_KEY" });
    }

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "halo_builder_v5",
            strict: true,
            schema: {
              type: "object",
              properties: {
                type: { enum: ["project", "chat"] },
                title: { type: "string" },
                summary: { type: "string" },
                text: { type: "string" },
                files: {
                  type: "object",
                  properties: {
                    "index.html": { type: "string" },
                    "style.css": { type: "string" },
                    "app.js": { type: "string" }
                  },
                  additionalProperties: { type: "string" }
                }
              },
              required: ["type"],
              additionalProperties: false
            }
          }
        },
        messages: [
          {
            role: "system",
            content: `
You are Halo Builder V5.

Return ONLY valid JSON.

If the user wants to build an app, return:
{
  "type": "project",
  "title": "App name",
  "summary": "Short one-line summary",
  "files": {
    "index.html": "<!doctype html>...",
    "style.css": "body { ... }",
    "app.js": "console.log('hello');"
  }
}

Rules:
- Return complete, runnable HTML/CSS/JS.
- Make the app modern and mobile-friendly.
- Do not use markdown.
- Do not use backticks.
- Do not add explanations outside JSON.

If the user is asking a normal question, return:
{
  "type": "chat",
  "text": "..."
}
            `.trim(),
          },
          ...(Array.isArray(memory) ? memory.slice(-12) : []),
          { role: "user", content: String(prompt) },
        ],
      }),
    });

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";

    if (!raw) {
      return res.status(200).json({ type: "chat", text: "No response" });
    }

    const jsonText = extractFirstJsonObject(raw);
    if (jsonText) {
      try {
        return res.status(200).json(normalizeResponse(JSON.parse(jsonText)));
      } catch {
        // fall through
      }
    }

    try {
      return res.status(200).json(normalizeResponse(JSON.parse(raw)));
    } catch {
      return res.status(200).json({ type: "chat", text: raw });
    }
  } catch (err) {
    return res.status(200).json({
      type: "chat",
      text: `ERROR: ${err.message}`,
    });
  }
}
