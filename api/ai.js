const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

function stripCodeFences(text = "") {
  return text
    .replace(/^```[a-zA-Z]*\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
}

function extractTag(text, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = text.match(re);
  return match ? match[1].trim() : "";
}

function extractCdata(text, tag) {
  const re = new RegExp(
    `<${tag}>\\s*<!\$begin:math:display$CDATA\\\\\[\(\[\\\\s\\\\S\]\*\?\)\\$end:math:display$\\]>\\s*</${tag}>`,
    "i"
  );
  const match = text.match(re);
  return match ? match[1].trim() : "";
}

function parseModelResponse(rawText) {
  const text = stripCodeFences(rawText);

  const kind = extractTag(text, "kind") || extractTag(text, "type");
  const title = extractTag(text, "title");
  const summary = extractTag(text, "summary");
  const code = extractCdata(text, "code") || extractTag(text, "code");
  const chat = extractTag(text, "chat") || extractTag(text, "reply") || text;

  if (code) {
    return {
      kind: "project",
      title: title || "Untitled App",
      summary: summary || "AI-generated app",
      code: code.trim(),
    };
  }

  if (kind.toLowerCase() === "chat" || chat) {
    return {
      kind: "chat",
      text: chat.trim(),
    };
  }

  return {
    kind: "chat",
    text: text || "No response",
  };
}

module.exports = async function handler(req, res) {
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
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `
You are Halo Builder V2.

Goal:
- If the user wants to build an app, return exactly this format:
<project>
  <kind>project</kind>
  <title>App Name</title>
  <summary>Short one-line summary</summary>
  <code><![CDATA[
<!DOCTYPE html>
<html>
...
</html>
  ]]></code>
</project>

Rules for app generation:
- Return a complete single-file HTML app.
- Include CSS inside <style> and JS inside <script>.
- No markdown, no backticks, no explanations outside the tags.
- Make the app polished, modern, and mobile-friendly.

If the user is asking a normal question or chat, return:
<chat>Your answer here</chat>

Keep it concise and useful.
            `.trim(),
          },
          ...(Array.isArray(memory) ? memory.slice(-12) : []),
          {
            role: "user",
            content: prompt || "",
          },
        ],
      }),
    });

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    if (!rawText) {
      return res.status(200).json({
        kind: "chat",
        text: "No response",
      });
    }

    return res.status(200).json(parseModelResponse(rawText));
  } catch (error) {
    return res.status(200).json({
      kind: "chat",
      text: `ERROR: ${error.message}`,
    });
  }
};
