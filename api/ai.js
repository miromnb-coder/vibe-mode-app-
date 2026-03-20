export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ type: "chat", text: "Only POST allowed" });
  }

  const prompt = String(req.body?.prompt || "").trim();

  if (!prompt) {
    return res.status(400).json({ type: "chat", text: "No prompt provided" });
  }

  const escapeHTML = (s = "") =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const escapeScript = (s = "") =>
    String(s).replaceAll("</script>", "<\\/script>");

  const buildFallbackHtml = (titleText, summaryText) => {
    const safeTitle = escapeHTML(titleText);
    const safeSummary = escapeHTML(summaryText);

    return `<!doctype html>
<html lang="fi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #05070d;
      --panel: rgba(10, 14, 24, 0.92);
      --line: rgba(62, 248, 208, 0.2);
      --text: #e8fff9;
      --muted: rgba(232, 255, 249, 0.7);
      --accent: #3ef8d0;
      --accent2: #9a7cff;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top, rgba(62, 248, 208, 0.12), transparent 30%),
        radial-gradient(circle at right, rgba(154, 124, 255, 0.14), transparent 26%),
        var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .app {
      width: min(900px, 100%);
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: 0 0 28px rgba(62, 248, 208, 0.12);
      padding: 20px;
    }

    .badge {
      display: inline-flex;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(62, 248, 208, 0.08);
      color: var(--accent);
      border: 1px solid rgba(62, 248, 208, 0.16);
      margin-bottom: 16px;
      font-size: 13px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(28px, 5vw, 48px);
      line-height: 1.05;
    }

    p {
      margin: 0 0 18px;
      color: var(--muted);
      max-width: 60ch;
    }

    .card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 18px;
      padding: 16px;
      margin-top: 16px;
    }

    .row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    input {
      flex: 1;
      min-width: 0;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(62, 248, 208, 0.24);
      background: rgba(255, 255, 255, 0.03);
      color: var(--text);
      outline: none;
      font-size: 16px;
    }

    button {
      padding: 14px 16px;
      border-radius: 16px;
      border: none;
      background: linear-gradient(135deg, var(--accent), #8cf7f0);
      color: #03110f;
      font-weight: 800;
      cursor: pointer;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 16px 0 0;
      display: grid;
      gap: 10px;
    }

    li {
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .hint {
      margin-top: 14px;
      color: rgba(232, 255, 249, 0.48);
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main class="app">
    <div class="badge">HALO AI BUILDER</div>
    <h1>${safeTitle}</h1>
    <p>${safeSummary}</p>

    <div class="card">
      <div class="row">
        <input id="input" placeholder="Kirjoita tähän..." />
        <button onclick="addItem()">Lisää</button>
      </div>
      <ul id="list"></ul>
    </div>

    <div class="hint">Tämä on fallback-appi, joten preview toimii aina.</div>
  </main>

  <script>
    function addItem() {
      const input = document.getElementById("input");
      const list = document.getElementById("list");

      const value = (input.value || "").trim();
      if (!value) return;

      const li = document.createElement("li");
      li.textContent = value;
      list.appendChild(li);

      input.value = "";
      input.focus();
    }
  </script>
</body>
</html>`;
  };

  const composeHtml = (obj) => {
    const title = String(obj?.title || "Generated App");
    const summary = String(obj?.summary || "AI-generated app");
    const html = String(obj?.html || "").trim();
    const css = String(obj?.css || "");
    const js = String(obj?.js || "");

    if (!html) {
      return buildFallbackHtml(title, summary);
    }

    let finalHtml = html;

    if (css) {
      if (finalHtml.includes("</head>")) {
        finalHtml = finalHtml.replace("</head>", `<style>${css}</style></head>`);
      } else {
        finalHtml = `<style>${css}</style>${finalHtml}`;
      }
    }

    if (js) {
      const safeJs = escapeScript(js);
      if (finalHtml.includes("</body>")) {
        finalHtml = finalHtml.replace("</body>", `<script>${safeJs}</script></body>`);
      } else {
        finalHtml += `<script>${safeJs}</script>`;
      }
    }

    if (!/<html[\s>]/i.test(finalHtml)) {
      finalHtml = `<!doctype html>
<html lang="fi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(title)}</title>
  ${css ? `<style>${css}</style>` : ""}
</head>
<body>
  ${finalHtml}
  ${js ? `<script>${escapeScript(js)}</script>` : ""}
</body>
</html>`;
    }

    return finalHtml;
  };

  const fallback = buildFallbackHtml(prompt, `AI tekee tästä appin: ${prompt}`);

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({
        type: "project",
        title: prompt,
        summary: "Fallback app",
        text: fallback,
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "You are Halo Builder.",
              "Return ONLY valid JSON.",
              "If the user wants an app, return this shape:",
              `{ "type": "project", "title": "App name", "summary": "Short summary", "html": "<!doctype html>...</html>", "css": "optional css", "js": "optional js" }`,
              "If it is not an app request, return:",
              `{ "type": "chat", "text": "..." }`,
              "No markdown. No backticks. No explanation outside JSON.",
            ].join("\n"),
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    const raw = String(data?.choices?.[0]?.message?.content || "").trim();

    if (!raw) {
      return res.status(200).json({
        type: "project",
        title: prompt,
        summary: "Fallback app",
        text: fallback,
      });
    }

    const cleaned = raw
      .replaceAll("```json", "")
      .replaceAll("```javascript", "")
      .replaceAll("```html", "")
      .replaceAll("```", "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);

      if (parsed?.type === "chat") {
        return res.status(200).json({
          type: "chat",
          text: String(parsed.text || "No response"),
        });
      }

      const title = String(parsed?.title || prompt || "Generated App");
      const summary = String(parsed?.summary || "AI-generated app");
      const finalHtml = composeHtml(parsed);

      return res.status(200).json({
        type: "project",
        title,
        summary,
        text: finalHtml,
      });
    } catch {
      return res.status(200).json({
        type: "project",
        title: prompt,
        summary: "Generated app",
        text: fallback,
      });
    }
  } catch (err) {
    return res.status(200).json({
      type: "project",
      title: prompt,
      summary: "Fallback app",
      text: fallback,
      error: String(err.message || err),
    });
  }
}
