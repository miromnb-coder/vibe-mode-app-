import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE = {
  projects: "halo_v5_projects",
  memory: "halo_v5_memory",
  selected: "halo_v5_selected",
};

function loadJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function escapeScriptTag(js = "") {
  return String(js).replace(/<\/script>/gi, "<\\/script>");
}

function buildPreviewDoc(files = {}) {
  const html = String(files["index.html"] || "").trim();
  const css = String(files["style.css"] || "");
  const js = String(files["app.js"] || "");
  const safeJs = escapeScriptTag(js);

  if (!html) {
    return `<!doctype html>
<html>
  <body style="margin:0;font-family:-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;background:#fff;color:#111;">
    <div>No index.html</div>
  </body>
</html>`;
  }

  let doc = html;

  if (css) {
    if (doc.includes("</head>")) {
      doc = doc.replace("</head>", `<style>${css}</style></head>`);
    } else {
      doc = `<style>${css}</style>${doc}`;
    }
  }

  if (js) {
    if (doc.includes("</body>")) {
      doc = doc.replace("</body>", `<script>${safeJs}</script></body>`);
    } else {
      doc += `<script>${safeJs}</script>`;
    }
  }

  if (!/<html[\s>]/i.test(doc)) {
    doc = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${css ? `<style>${css}</style>` : ""}
</head>
<body>
  ${doc}
  ${js ? `<script>${safeJs}</script>` : ""}
</body>
</html>`;
  }

  return doc;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [projects, setProjects] = useState([]);
  const [memory, setMemory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeFile, setActiveFile] = useState("index.html");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [mode, setMode] = useState("preview");

  const boardRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    setProjects(loadJSON(STORAGE.projects, []));
    setMemory(loadJSON(STORAGE.memory, []));
    setSelectedId(loadJSON(STORAGE.selected, null));
  }, []);

  useEffect(() => {
    saveJSON(STORAGE.projects, projects);
    saveJSON(STORAGE.memory, memory);
    saveJSON(STORAGE.selected, selectedId);
  }, [projects, memory, selectedId]);

  useEffect(() => {
    if (!selectedId && projects.length > 0) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedId) || projects[0] || null;
  }, [projects, selectedId]);

  useEffect(() => {
    if (!selectedProject) {
      setActiveFile("index.html");
      return;
    }
    const first = Object.keys(selectedProject.files || {})[0] || "index.html";
    setActiveFile(first);
  }, [selectedProject?.id]);

  const previewDoc = useMemo(() => {
    if (!selectedProject) {
      return `<!doctype html>
<html>
  <body style="margin:0;font-family:-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;background:#fff;color:#111;">
    <div>Valitse projekti</div>
  </body>
</html>`;
    }
    return buildPreviewDoc(selectedProject.files || {});
  }, [selectedProject]);

  function pushMemory(role, content) {
    setMemory((prev) => [...prev.slice(-23), { role, content }]);
  }

  async function askAI(text) {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text, memory }),
    });
    return await res.json();
  }

  async function buildProject() {
    const text = prompt.trim();
    if (!text) return;

    setLoading(true);
    setStatus("Building...");
    pushMemory("user", text);

    try {
      const data = await askAI(text);

      if (data?.type === "project") {
        const files = data.files || {};
        const project = {
          id: uid(),
          title: String(data.title || "Untitled App"),
          summary: String(data.summary || text),
          files,
          x: 18 + Math.random() * 120,
          y: 18 + Math.random() * 120,
          createdAt: Date.now(),
        };

        setProjects((prev) => [project, ...prev]);
        setSelectedId(project.id);
        setActiveFile(Object.keys(files)[0] || "index.html");
        pushMemory("assistant", `Created project: ${project.title}`);
        setPrompt("");
        setMode("preview");
        setStatus("Created");
        return;
      }

      const reply = String(data?.text || "No response");
      pushMemory("assistant", reply);
      setStatus("Chat");
      alert(reply);
    } catch (err) {
      const msg = `ERROR: ${err.message}`;
      pushMemory("assistant", msg);
      setStatus("Error");
      alert(msg);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus("Ready"), 900);
    }
  }

  function clearProjects() {
    if (!confirm("Tyhjennetäänkö kaikki projektit?")) return;
    setProjects([]);
    setSelectedId(null);
    setActiveFile("index.html");
    setStatus("Cleared");
    setTimeout(() => setStatus("Ready"), 900);
  }

  function deleteProject(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) {
      const next = projects.find((p) => p.id !== id);
      setSelectedId(next ? next.id : null);
      setActiveFile("index.html");
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
      () => {
        setStatus("Copied");
        setTimeout(() => setStatus("Ready"), 900);
      },
      () => {
        setStatus("Copy failed");
        setTimeout(() => setStatus("Ready"), 900);
      }
    );
  }

  function copyActiveFile() {
    if (!selectedProject) return;
    copyToClipboard(String(selectedProject.files?.[activeFile] || ""));
  }

  function copyAllFiles() {
    if (!selectedProject) return;
    const out = Object.entries(selectedProject.files || {})
      .map(([name, content]) => `// FILE: ${name}\n${content}`)
      .join("\n\n");
    copyToClipboard(out);
  }

  function openProject(id) {
    setSelectedId(id);
    setMode("preview");
  }

  function startDrag(e, project) {
    if (!boardRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = boardRef.current.getBoundingClientRect();
    dragRef.current = {
      id: project.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: project.x || 0,
      originY: project.y || 0,
      width: rect.width,
      height: rect.height,
    };

    setStatus("Dragging");

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const cardW = 250;
      const cardH = 150;

      const nextX = clamp(dragRef.current.originX + dx, 0, Math.max(0, dragRef.current.width - cardW));
      const nextY = clamp(dragRef.current.originY + dy, 0, Math.max(0, dragRef.current.height - cardH));

      setProjects((prev) =>
        prev.map((p) => (p.id === dragRef.current.id ? { ...p, x: nextX, y: nextY } : p))
      );
    };

    const onUp = () => {
      dragRef.current = null;
      setStatus("Ready");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const fileNames = selectedProject ? Object.keys(selectedProject.files || {}) : [];
  const activeFileContent =
    selectedProject && selectedProject.files ? selectedProject.files[activeFile] : "";

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="spark">✦</span>
          <span>Halo Builder V5</span>
        </div>
        <div className="topbar-right">
          <span className="pill">{status}</span>
          <div className="avatar">M</div>
        </div>
      </header>

      <main className="grid">
        <section className="panel left">
          <div className="hero">
            <h1>Rakennetaan jotain, Miro</h1>
            <p>Kirjoita idea ja AI tekee siitä oikean moni­tiedostoisen appin.</p>

            <div className="inputRow">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tee todo app jossa voi lisätä, poistaa ja merkitä tehtäviä..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") buildProject();
                }}
              />
              <button onClick={buildProject} disabled={loading}>
                {loading ? "Building..." : "Build"}
              </button>
            </div>

            <div className="quickRow">
              <button
                className="ghost"
                onClick={() =>
                  setPrompt("Tee moderni task app, jossa voi lisätä, poistaa ja merkitä valmiiksi tehtäviä.")
                }
              >
                Task app
              </button>
              <button
                className="ghost"
                onClick={() =>
                  setPrompt("Tee notes app, jossa voi kirjoittaa muistiinpanoja ja tallentaa ne selaimeen.")
                }
              >
                Notes app
              </button>
              <button
                className="ghost"
                onClick={() =>
                  setPrompt("Tee dashboard-app, jossa on kortteja, tilastoja ja tumma futuristinen ulkoasu.")
                }
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="sectionHead">
            <h2>Projektit</h2>
            <button className="small" onClick={clearProjects}>
              Tyhjennä
            </button>
          </div>

          <div className="board" ref={boardRef}>
            {projects.length === 0 ? (
              <div className="empty">Ei projekteja vielä. Kirjoita idea ja paina Build.</div>
            ) : (
              projects.map((project, index) => {
                const isSelected = project.id === selectedId;
                const left = typeof project.x === "number" ? project.x : 18 + (index % 2) * 28;
                const top = typeof project.y === "number" ? project.y : 18 + (index % 4) * 26;

                return (
                  <div
                    key={project.id}
                    className={`projectCard ${isSelected ? "selected" : ""}`}
                    style={{ left, top }}
                    onClick={() => openProject(project.id)}
                  >
                    <div className="cardHead" onPointerDown={(e) => startDrag(e, project)}>
                      <div className="cardTitle">⠿ {project.title}</div>
                      <span className="dragHint">drag</span>
                    </div>

                    <div className="cardSummary">{project.summary}</div>

                    <div className="cardActions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProject(project.id);
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(
                            JSON.stringify(
                              {
                                title: project.title,
                                summary: project.summary,
                                files: project.files,
                              },
                              null,
                              2
                            )
                          );
                        }}
                      >
                        Copy JSON
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="panel center">
          <div className="sectionHead">
            <h2>{selectedProject ? selectedProject.title : "Selected project"}</h2>
            <div className="tabs">
              <button className={`tab ${mode === "preview" ? "active" : ""}`} onClick={() => setMode("preview")}>
                Preview
              </button>
              <button className={`tab ${mode === "code" ? "active" : ""}`} onClick={() => setMode("code")}>
                Code
              </button>
            </div>
          </div>

          {!selectedProject ? (
            <div className="emptyPanel">Valitse projekti vasemmalta.</div>
          ) : (
            <>
              <div className="summaryBox">{selectedProject.summary || "No summary"}</div>

              <div className="fileBar">
                {fileNames.map((name) => (
                  <button
                    key={name}
                    className={`fileTab ${activeFile === name ? "active" : ""}`}
                    onClick={() => setActiveFile(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="codeTools">
                <button className="small" onClick={copyActiveFile}>
                  Copy file
                </button>
                <button className="small" onClick={copyAllFiles}>
                  Copy all
                </button>
              </div>

              <div className="codeCard" style={{ display: mode === "code" ? "block" : "none" }}>
                <pre>{activeFileContent || "No file content"}</pre>
              </div>

              <div className="projectMeta">
                <div>
                  <span className="metaLabel">Files</span>
                  <span className="metaValue">{fileNames.length}</span>
                </div>
                <div>
                  <span className="metaLabel">Created</span>
                  <span className="metaValue">
                    {selectedProject.createdAt ? new Date(selectedProject.createdAt).toLocaleString() : "-"}
                  </span>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="panel right">
          <div className="sectionHead">
            <h2>Live preview</h2>
            <button className="small" onClick={() => setMode("preview")}>
              Focus
            </button>
          </div>

          <div className="previewWrap" style={{ display: mode === "preview" ? "block" : "none" }}>
            <iframe
              title="preview"
              srcDoc={previewDoc}
              sandbox="allow-scripts allow-forms allow-modals"
            />
          </div>

          <div className="previewHint" style={{ display: mode === "preview" ? "none" : "block" }}>
            Preview on piilossa Code-tilassa. Paina Preview.
          </div>
        </section>
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #__next {
          margin: 0;
          min-height: 100%;
          background:
            radial-gradient(circle at top left, rgba(154, 124, 255, 0.15), transparent 28%),
            radial-gradient(circle at top right, rgba(62, 248, 208, 0.12), transparent 26%),
            linear-gradient(180deg, #070812 0%, #04050a 100%);
          color: #e8fff9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        button,
        input {
          font: inherit;
        }

        .shell {
          max-width: 1600px;
          margin: 0 auto;
          padding: 18px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #3ef8d0;
          font-weight: 800;
          letter-spacing: 0.2px;
          text-shadow: 0 0 18px rgba(62, 248, 208, 0.28);
        }

        .spark {
          font-size: 18px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pill {
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(62, 248, 208, 0.08);
          border: 1px solid rgba(62, 248, 208, 0.18);
          color: #3ef8d0;
          box-shadow: 0 0 22px rgba(62, 248, 208, 0.18);
          font-size: 13px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .grid {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .panel {
          min-width: 0;
          background: rgba(10, 14, 24, 0.82);
          border: 1px solid rgba(120, 255, 231, 0.18);
          border-radius: 24px;
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.34),
            0 0 28px rgba(62, 248, 208, 0.12);
          backdrop-filter: blur(18px);
        }

        .left,
        .center,
        .right {
          padding: 18px;
        }

        .hero h1 {
          margin: 0 0 10px;
          font-size: clamp(28px, 4vw, 52px);
          line-height: 1.02;
        }

        .hero p {
          margin: 0 0 18px;
          color: rgba(232, 255, 249, 0.7);
          max-width: 54ch;
        }

        .inputRow {
          display: flex;
          gap: 10px;
        }

        .inputRow input {
          flex: 1;
          min-width: 0;
          padding: 15px 16px;
          border-radius: 16px;
          border: 1px solid rgba(62, 248, 208, 0.34);
          background: rgba(255, 255, 255, 0.03);
          color: #e8fff9;
          outline: none;
        }

        .inputRow input::placeholder {
          color: rgba(232, 255, 249, 0.42);
        }

        .inputRow button {
          padding: 0 18px;
          border-radius: 16px;
          border: 0;
          background: linear-gradient(135deg, #3ef8d0, #8cf7f0);
          color: #04110f;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 0 22px rgba(62, 248, 208, 0.24);
        }

        .inputRow button:disabled {
          opacity: 0.7;
          cursor: progress;
        }

        .quickRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .ghost,
        .small,
        .tab,
        .fileTab {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #e8fff9;
          border-radius: 14px;
          cursor: pointer;
        }

        .ghost {
          padding: 10px 12px;
          font-size: 13px;
        }

        .small {
          padding: 9px 12px;
          font-size: 13px;
        }

        .sectionHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .sectionHead h2 {
          margin: 0;
          font-size: 18px;
        }

        .board {
          position: relative;
          min-height: 560px;
          border-radius: 20px;
          background:
            radial-gradient(circle at center, rgba(154, 124, 255, 0.12), transparent 34%),
            rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }

        .empty,
        .emptyPanel,
        .previewHint {
          color: rgba(232, 255, 249, 0.58);
          padding: 18px;
        }

        .projectCard {
          position: absolute;
          width: 250px;
          min-height: 150px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(9, 12, 21, 0.96);
          border: 1px solid rgba(62, 248, 208, 0.22);
          box-shadow: 0 0 24px rgba(62, 248, 208, 0.14);
          user-select: none;
        }

        .projectCard.selected {
          border-color: rgba(154, 124, 255, 0.5);
          box-shadow: 0 0 28px rgba(154, 124, 255, 0.22);
        }

        .cardHead {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          cursor: grab;
          touch-action: none;
          user-select: none;
        }

        .cardTitle {
          font-weight: 800;
          color: #3ef8d0;
          font-size: 14px;
        }

        .dragHint {
          font-size: 12px;
          color: rgba(232, 255, 249, 0.52);
        }

        .cardSummary {
          margin-top: 10px;
          color: rgba(232, 255, 249, 0.7);
          font-size: 13px;
          line-height: 1.45;
          min-height: 44px;
        }

        .cardActions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .cardActions button {
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: #e8fff9;
          cursor: pointer;
        }

        .tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tab.active,
        .fileTab.active {
          background: rgba(62, 248, 208, 0.12);
          border-color: rgba(62, 248, 208, 0.26);
          color: #3ef8d0;
        }

        .summaryBox {
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(232, 255, 249, 0.82);
          margin-bottom: 14px;
        }

        .fileBar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .fileTab {
          padding: 8px 10px;
          font-size: 12px;
        }

        .codeTools {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .codeCard {
          border-radius: 18px;
          border: 1px solid rgba(62, 248, 208, 0.16);
          background: rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .codeCard pre {
          margin: 0;
          padding: 16px;
          min-height: 420px;
          max-height: 520px;
          overflow: auto;
          white-space: pre-wrap;
          word-break: break-word;
          color: #d6fff4;
        }

        .projectMeta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 12px;
          color: rgba(232, 255, 249, 0.72);
          flex-wrap: wrap;
        }

        .metaLabel {
          display: block;
          font-size: 12px;
          opacity: 0.55;
        }

        .metaValue {
          display: block;
          margin-top: 4px;
          font-size: 13px;
        }

        .previewWrap {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(62, 248, 208, 0.18);
          background: white;
          min-height: 720px;
        }

        .previewWrap iframe {
          width: 100%;
          height: 100%;
          min-height: 720px;
          border: 0;
          background: white;
        }

        @media (max-width: 1180px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .previewWrap,
          .previewWrap iframe,
          .codeCard pre,
          .board {
            min-height: 520px;
          }
        }

        @media (max-width: 640px) {
          .shell {
            padding: 12px;
          }

          .inputRow {
            flex-direction: column;
          }

          .inputRow button {
            min-height: 48px;
          }

          .projectCard {
            width: 220px;
          }

          .previewWrap,
          .previewWrap iframe {
            min-height: 420px;
          }

          .board,
          .codeCard pre {
            min-height: 420px;
          }
        }
      `}</style>
    </div>
  );
}
