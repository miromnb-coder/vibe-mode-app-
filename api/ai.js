export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  const prompt = String(req.body?.prompt || "").trim();

  if (!prompt) {
    return res.status(200).json({
      type: "project",
      title: "No prompt",
      summary: "Empty prompt fallback",
      files: {
        "index.html": `<!doctype html>
<html lang="fi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>No prompt</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0b0f1a;
      color: #fff;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      max-width: 720px;
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ Ei promptia</h1>
    <p>Kirjoita mitä appia haluat.</p>
  </div>
</body>
</html>`,
      },
    });
  }

  const escapeHTML = (s = "") =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const safePrompt = escapeHTML(prompt);
  const lower = prompt.toLowerCase();

  const detectType = (text) => {
    if (/(todo|tehtävä|task|checklist|list)/i.test(text)) return "todo";
    if (/(muisti|note|notes|memo)/i.test(text)) return "notes";
    if (/(laskin|calculator|calc)/i.test(text)) return "calculator";
    if (/(kello|clock|timer|pomodoro)/i.test(text)) return "timer";
    if (/(quiz|visa|testi|kysely)/i.test(text)) return "quiz";
    if (/(chat|viesti|message)/i.test(text)) return "chat";
    if (/(dashboard|paneli|stats|tilasto)/i.test(text)) return "dashboard";
    if (/(habit|rutiini|seuranta|tracker)/i.test(text)) return "habit";
    if (/(landing|sivu|portfolio|hero)/i.test(text)) return "landing";
    if (/(game|peli|clicker|pong|snake)/i.test(text)) return "game";
    return "generic";
  };

  const makeShell = ({ title, body, styles = "", script = "" }) => {
    const safeTitle = escapeHTML(title);
    const safeScript = String(script).replace(/<\/script>/gi, "<\\/script>");

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
      --line: rgba(62, 248, 208, 0.18);
      --text: #e8fff9;
      --muted: rgba(232, 255, 249, 0.72);
      --accent: #3ef8d0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top, rgba(62, 248, 208, 0.10), transparent 30%),
        radial-gradient(circle at right, rgba(154, 124, 255, 0.10), transparent 26%),
        var(--bg);
      color: var(--text);
    }
    .wrap {
      max-width: 980px;
      margin: 0 auto;
      padding: 22px;
    }
    .hero {
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
      font-weight: 700;
    }
    h1 {
      margin: 0 0 8px;
      font-size: clamp(28px, 5vw, 52px);
      line-height: 1.03;
    }
    p {
      margin: 0 0 18px;
      color: var(--muted);
      max-width: 62ch;
      line-height: 1.5;
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 18px;
      padding: 16px;
      margin-top: 16px;
    }
    ${styles}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <div class="badge">HALO AI BUILDER</div>
      ${body}
    </section>
  </main>
  <script>
    ${safeScript}
  </script>
</body>
</html>`;
  };

  const apps = {
    todo: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>To-do app</h1>
          <p>Lisää, merkitse valmiiksi ja poista tehtäviä.</p>
          <div class="card">
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <input id="taskInput" placeholder="Kirjoita tehtävä..." style="flex:1;min-width:0;padding:14px 16px;border-radius:14px;border:1px solid rgba(62,248,208,.22);background:rgba(255,255,255,.03);color:#e8fff9;outline:none" />
              <button id="addBtn" style="padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Lisää</button>
            </div>
            <ul id="list" style="list-style:none;padding:0;margin:16px 0 0;display:grid;gap:10px"></ul>
          </div>
        `,
        script: `
          const input = document.getElementById("taskInput");
          const list = document.getElementById("list");
          document.getElementById("addBtn").onclick = () => {
            const value = (input.value || "").trim();
            if (!value) return;
            const li = document.createElement("li");
            li.style.cssText = "padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;gap:12px;align-items:center";
            li.innerHTML = \`
              <span style="cursor:pointer">\${value}</span>
              <button style="border:0;border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.08);color:#fff">Poista</button>
            \`;
            const text = li.querySelector("span");
            text.onclick = () => text.style.textDecoration = text.style.textDecoration === "line-through" ? "none" : "line-through";
            li.querySelector("button").onclick = () => li.remove();
            list.appendChild(li);
            input.value = "";
            input.focus();
          };
        `,
      }),

    notes: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Notes app</h1>
          <p>Kirjoita muistiinpanot ja tallenna ne selaimeen.</p>
          <div class="card">
            <textarea id="noteInput" placeholder="Kirjoita muistiinpano..." style="width:100%;min-height:120px;padding:14px 16px;border-radius:14px;border:1px solid rgba(62,248,208,.22);background:rgba(255,255,255,.03);color:#e8fff9;outline:none;resize:vertical"></textarea>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
              <button id="saveBtn" style="padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Tallenna</button>
              <button id="clearBtn" style="padding:14px 16px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff">Tyhjennä</button>
            </div>
            <ul id="notesList" style="list-style:none;padding:0;margin:16px 0 0;display:grid;gap:10px"></ul>
          </div>
        `,
        script: `
          const key = "halo_notes_v1";
          const input = document.getElementById("noteInput");
          const list = document.getElementById("notesList");

          function render() {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            list.innerHTML = "";
            items.forEach((item, idx) => {
              const li = document.createElement("li");
              li.style.cssText = "padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;gap:12px;align-items:start";
              li.innerHTML = \`
                <span style="white-space:pre-wrap;flex:1">\${item}</span>
                <button style="border:0;border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.08);color:#fff">X</button>
              \`;
              li.querySelector("button").onclick = () => {
                const next = JSON.parse(localStorage.getItem(key) || "[]").filter((_, i) => i !== idx);
                localStorage.setItem(key, JSON.stringify(next));
                render();
              };
              list.appendChild(li);
            });
          }

          document.getElementById("saveBtn").onclick = () => {
            const value = (input.value || "").trim();
            if (!value) return;
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            items.unshift(value);
            localStorage.setItem(key, JSON.stringify(items.slice(0, 20)));
            input.value = "";
            render();
          };

          document.getElementById("clearBtn").onclick = () => {
            localStorage.removeItem(key);
            render();
          };

          render();
        `,
      }),

    calculator: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Laskin</h1>
          <p>Syötä lasku ja saat tuloksen heti.</p>
          <div class="card">
            <input id="expr" placeholder="Esim. 12 * 8 + 4" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(62,248,208,.22);background:rgba(255,255,255,.03);color:#e8fff9;outline:none" />
            <button id="calcBtn" style="margin-top:10px;padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Laske</button>
            <div id="out" style="margin-top:14px;font-size:28px;font-weight:800;color:#3ef8d0">0</div>
          </div>
        `,
        script: `
          const expr = document.getElementById("expr");
          const out = document.getElementById("out");
          document.getElementById("calcBtn").onclick = () => {
            try {
              const value = Function("return (" + expr.value + ")")();
              out.textContent = String(value);
            } catch {
              out.textContent = "Virhe";
            }
          };
        `,
      }),

    timer: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Timer / Pomodoro</h1>
          <p>Käynnistä ajastin ja seuraa aikaa.</p>
          <div class="card" style="display:grid;gap:12px;justify-items:start">
            <div id="time" style="font-size:56px;font-weight:900;color:#3ef8d0">25:00</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button id="startBtn" style="padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Start</button>
              <button id="resetBtn" style="padding:14px 16px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff">Reset</button>
            </div>
          </div>
        `,
        script: `
          let total = 25 * 60;
          let timer = null;
          const time = document.getElementById("time");
          const render = () => {
            const m = String(Math.floor(total / 60)).padStart(2, "0");
            const s = String(total % 60).padStart(2, "0");
            time.textContent = m + ":" + s;
          };
          document.getElementById("startBtn").onclick = () => {
            if (timer) return;
            timer = setInterval(() => {
              total = Math.max(0, total - 1);
              render();
              if (total === 0) clearInterval(timer), timer = null;
            }, 1000);
          };
          document.getElementById("resetBtn").onclick = () => {
            clearInterval(timer);
            timer = null;
            total = 25 * 60;
            render();
          };
          render();
        `,
      }),

    quiz: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Quiz app</h1>
          <p>Pieni tietovisa, joka näyttää pisteet.</p>
          <div class="card">
            <div id="q" style="font-size:20px;font-weight:800;margin-bottom:14px">Mikä on 2 + 2?</div>
            <div style="display:grid;gap:10px">
              <button class="ans" data-a="3" style="padding:14px 16px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff">3</button>
              <button class="ans" data-a="4" style="padding:14px 16px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff">4</button>
              <button class="ans" data-a="5" style="padding:14px 16px;border:0;border-radius:14px;background:rgba(255,255,255,.08);color:#fff">5</button>
            </div>
            <div id="score" style="margin-top:14px;color:#3ef8d0;font-weight:800">Pisteet: 0</div>
          </div>
        `,
        script: `
          let score = 0;
          const scoreEl = document.getElementById("score");
          document.querySelectorAll(".ans").forEach(btn => {
            btn.onclick = () => {
              if (btn.dataset.a === "4") score++;
              else score = Math.max(0, score - 1);
              scoreEl.textContent = "Pisteet: " + score;
            };
          });
        `,
      }),

    chat: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Chat app</h1>
          <p>Lisää viestejä ja katso niitä listassa.</p>
          <div class="card">
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <input id="msg" placeholder="Kirjoita viesti..." style="flex:1;min-width:0;padding:14px 16px;border-radius:14px;border:1px solid rgba(62,248,208,.22);background:rgba(255,255,255,.03);color:#e8fff9;outline:none" />
              <button id="send" style="padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Lähetä</button>
            </div>
            <div id="feed" style="display:grid;gap:10px;margin-top:16px"></div>
          </div>
        `,
        script: `
          const msg = document.getElementById("msg");
          const feed = document.getElementById("feed");
          document.getElementById("send").onclick = () => {
            const value = (msg.value || "").trim();
            if (!value) return;
            const bubble = document.createElement("div");
            bubble.style.cssText = "padding:12px 14px;border-radius:16px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06)";
            bubble.textContent = value;
            feed.appendChild(bubble);
            msg.value = "";
            msg.focus();
          };
        `,
      }),

    dashboard: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Dashboard</h1>
          <p>Tilastoja ja kortteja futuristisella ulkoasulla.</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
            <div class="card"><div style="font-size:13px;opacity:.7">Käyttäjiä</div><div style="font-size:34px;font-weight:900;color:#3ef8d0">128</div></div>
            <div class="card"><div style="font-size:13px;opacity:.7">Projektit</div><div style="font-size:34px;font-weight:900;color:#3ef8d0">42</div></div>
            <div class="card"><div style="font-size:13px;opacity:.7">Tila</div><div style="font-size:34px;font-weight:900;color:#3ef8d0">OK</div></div>
          </div>
        `,
      }),

    habit: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Habit tracker</h1>
          <p>Merkitse päivän rutiinit tehdyiksi.</p>
          <div class="card">
            <div id="habits" style="display:grid;gap:10px"></div>
            <button id="addHabit" style="margin-top:14px;padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Lisää rutiini</button>
          </div>
        `,
        script: `
          const habits = document.getElementById("habits");
          const key = "halo_habits_v1";
          const saved = JSON.parse(localStorage.getItem(key) || "[]");
          const render = () => {
            habits.innerHTML = "";
            saved.forEach((h, i) => {
              const row = document.createElement("label");
              row.style.cssText = "display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06)";
              row.innerHTML = \`<input type="checkbox" \${h.done ? "checked" : ""} /> <span style="flex:1">\${h.name}</span>\`;
              row.querySelector("input").onchange = (e) => {
                saved[i].done = e.target.checked;
                localStorage.setItem(key, JSON.stringify(saved));
              };
              habits.appendChild(row);
            });
          };
          document.getElementById("addHabit").onclick = () => {
            const name = prompt("Rutiinin nimi?");
            if (!name) return;
            saved.unshift({ name, done: false });
            localStorage.setItem(key, JSON.stringify(saved));
            render();
          };
          render();
        `,
      }),

    landing: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Landing page</h1>
          <p>Tyylikäs etusivu tuotteelle tai palvelulle.</p>
          <div class="card" style="display:grid;gap:12px">
            <div style="font-size:28px;font-weight:900">Tervetuloa</div>
            <div style="color:rgba(255,255,255,.72)">Tämä on moderni hero-alue, CTA ja kortti.</div>
            <button style="width:max-content;padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Aloita</button>
          </div>
        `,
      }),

    game: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>Clicker game</h1>
          <p>Paina nappia ja kasvata pistettä.</p>
          <div class="card" style="display:grid;gap:14px;justify-items:start">
            <div id="score" style="font-size:56px;font-weight:900;color:#3ef8d0">0</div>
            <button id="tap" style="padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Tap</button>
          </div>
        `,
        script: `
          let score = 0;
          const el = document.getElementById("score");
          document.getElementById("tap").onclick = () => {
            score++;
            el.textContent = String(score);
          };
        `,
      }),

    generic: () =>
      makeShell({
        title: prompt,
        body: `
          <h1>${safePrompt}</h1>
          <p>AI teki tästä yleisen appin, koska tyyppiä ei tunnistettu tarkasti.</p>
          <div class="card">
            <input id="input" placeholder="Kirjoita jotain..." style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(62,248,208,.22);background:rgba(255,255,255,.03);color:#e8fff9;outline:none" />
            <button id="add" style="margin-top:10px;padding:14px 16px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ef8d0,#8cf7f0);color:#03110f;font-weight:800">Lisää</button>
            <div id="out" style="display:grid;gap:10px;margin-top:16px"></div>
          </div>
        `,
        script: `
          const input = document.getElementById("input");
          const out = document.getElementById("out");
          document.getElementById("add").onclick = () => {
            const value = (input.value || "").trim();
            if (!value) return;
            const row = document.createElement("div");
            row.style.cssText = "padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06)";
            row.textContent = value;
            out.appendChild(row);
            input.value = "";
            input.focus();
          };
        `,
      }),
  };

  const localHtml = () => {
    const type = detectType(lower);
    return (apps[type] || apps.generic)();
  };

  const fallback = localHtml();

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({ text: fallback });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content: [
              "You are an AI app generator.",
              "Create ONE complete single-file HTML app based on the user's prompt.",
              "Make it look different depending on the app type.",
              "Always return ONLY raw HTML.",
              "No markdown, no backticks, no code fences, no explanation.",
              "Use inline CSS and vanilla JS.",
              "Make the app mobile-friendly and polished.",
            ].join("\n"),
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();
    let html = String(data?.choices?.[0]?.message?.content || "").trim();

    html = html
      .replaceAll("```html", "")
      .replaceAll("```", "")
      .trim();

    if (!html || !html.toLowerCase().includes("<html")) {
      return res.status(200).json({ text: fallback });
    }

    return res.status(200).json({ text: html });
  } catch (err) {
    return res.status(200).json({
      text: fallback,
      error: String(err.message || err),
    });
  }
}
