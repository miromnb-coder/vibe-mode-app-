const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

function stripCodeFences(text = "") {
  return String(text)
    .replace(/^```(?:json|js|javascript|html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonBlock(text = "") {
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

function normalizeParsedObject(obj) {
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

  return {
    type: "chat",
    text: "No response",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { prompt, memory = [] } = req.body || {};

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY" });
    }

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content: `
You are Halo Builder V4.

Return ONLY valid JSON.

If the user wants to build an app, return:

{
  "type": "project",
  "title": "App name",
  "summary": "Short one-line summary",
  "files": {
    "index.html": [
      "<!doctype html>",
      "<html>",
      "...lines...",
      "</html>"
    ],
    "style.css": [
      "body {",
      "  margin: 0;",
      "}"
    ],
    "app.js": [
      "console.log('hello');"
    ]
  }
}

Rules:
- Always use arrays of lines for file contents.
- Always make the app complete and runnable.
- Keep it polished, modern, mobile-friendly.
- No markdown, no code fences, no explanations outside JSON.

If the user is asking a normal question, return:

{
  "type": "chat",
  "text": "..."
}
            `.trim(),
          },
          ...(Array.isArray(memory) ? memory.slice(-12) : []),
          {
            role: "user",
            content: String(prompt || ""),
          },
        ],
      }),
    });

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || "";
    const cleaned = stripCodeFences(rawText);

    const jsonText = extractFirstJsonBlock(cleaned);
    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        return res.status(200).json(normalizeParsedObject(parsed));
      } catch {
        // fall through
      }
    }

    return res.status(200).json({
      type: "chat",
      text: cleaned || "No response",
    });
  } catch (error) {
    return res.status(200).json({
      type: "chat",
      text: `ERROR: ${error.message}`,
    });
  }
}
