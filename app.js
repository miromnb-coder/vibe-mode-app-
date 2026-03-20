const STORAGE_KEYS = {
  projects: "halo_builder_projects_v2",
  memory: "halo_builder_memory_v2",
  selected: "halo_builder_selected_v2",
};

const state = {
  projects: loadJSON(STORAGE_KEYS.projects, []),
  memory: loadJSON(STORAGE_KEYS.memory, []),
  selectedId: loadJSON(STORAGE_KEYS.selected, null),
  view: "preview",
};

const els = {};

function $(id) {
  return document.getElementById(id);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function persist() {
  saveJSON(STORAGE_KEYS.projects, state.projects);
  saveJSON(STORAGE_KEYS.memory, state.memory);
  saveJSON(STORAGE_KEYS.selected, state.selectedId);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(text) {
  els.statusPill.textContent = text;
}

function setView(view) {
  state.view = view;
  els.previewTabBtn.classList.toggle("active", view === "preview");
  els.codeTabBtn.classList.toggle("active", view === "code");
  els.previewWrap.classList.toggle("hidden", view !== "preview");
  els.codeView.classList.toggle("hidden", view !== "code");
}

function currentProject() {
  return state.projects.find((p) => p.id === state.selectedId) || null;
}

function pushMemory(role, content) {
  state.memory.push({ role, content });
  state.memory = state.memory.slice(-24);
  persist();
}

async function askAI(prompt) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      memory: state.memory,
    }),
  });

  return await response.json();
}

function projectSrcDoc(project) {
  return project.code || "<!doctype html><html><body></body></html>";
}

function renderPreview(project) {
  if (!project) {
    els.previewTitle.textContent = "Preview";
    els.previewFrame.srcdoc = `
      <!doctype html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, sans-serif;
              display: grid;
              place-items: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
              color: #111;
            }
          </style>
        </head>
        <body>
          <div>No project selected</div>
        </body>
      </html>
    `;
    els.codeView.textContent = "Avaa projekti painamalla Open.";
    return;
  }

  els.previewTitle.textContent = project.title || "Preview";
  els.previewFrame.srcdoc = projectSrcDoc(project);
  els.codeView.textContent = project.code || "";
}

function renderProjects() {
  const board = els.projectBoard;
  board.innerHTML = "";

  if (!state.projects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Ei projekteja vielä. Kirjoita idea ja paina Build.";
    board.appendChild(empty);
    renderPreview(null);
    return;
  }

  const boardRect = board.getBoundingClientRect();

  state.projects.forEach((project, index) => {
    if (typeof project.x !== "number" || typeof project.y !== "number") {
      project.x = 18 + ((index * 28) % Math.max(60, Math.floor(boardRect.width - 280)));
      project.y = 18 + ((index * 34) % Math.max(60, Math.floor(boardRect.height - 140)));
    }

    const card = document.createElement("div");
    card.className = "project-card" + (project.id === state.selectedId ? " selected" : "");
    card.dataset.id = project.id;
    card.style.left = `${project.x}px`;
    card.style.top = `${project.y}px`;

    card.innerHTML = `
      <div class="card-head">
        <div class="card-title">⠿ ${escapeHTML(project.title || "Untitled App")}</div>
        <span style="opacity:.6;font-size:12px;">drag</span>
      </div>
      <div class="card-summary">${escapeHTML(project.summary || "No summary")}</div>
      <div class="card-actions">
        <button data-action="open">Open</button>
        <button data-action="copy">Copy</button>
        <button data-action="delete">Delete</button>
      </div>
    `;

    const head = card.querySelector(".card-head");
    const openBtn = card.querySelector('[data-action="open"]');
    const copyBtn = card.querySelector('[data-action="copy"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');

    openBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openProject(project.id);
    });

    copyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(project.code || "");
        setStatus("Copied");
        setTimeout(() => setStatus("Ready"), 1000);
      } catch {
        setStatus("Copy failed");
        setTimeout(() => setStatus("Ready"), 1200);
      }
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteProject(project.id);
    });

    enableDrag(card, head, project);
    card.addEventListener("click", () => openProject(project.id));

    board.appendChild(card);
  });

  renderPreview(currentProject() || state.projects[0]);
}

function enableDrag(card, handle, project) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let pointerId = null;

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    pointerId = e.pointerId;
    handle.setPointerCapture(pointerId);
    startX = e.clientX;
    startY = e.clientY;
    originX = project.x || 0;
    originY = project.y || 0;
    setStatus("Dragging");
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const board = els.projectBoard;
    const boardRect = board.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    const nextX = originX + (e.clientX - startX);
    const nextY = originY + (e.clientY - startY);

    project.x = clamp(nextX, 0, Math.max(0, boardRect.width - cardRect.width));
    project.y = clamp(nextY, 0, Math.max(0, boardRect.height - cardRect.height));

    card.style.left = `${project.x}px`;
    card.style.top = `${project.y}px`;
  });

  handle.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (pointerId !== null) {
      try {
        handle.releasePointerCapture(pointerId);
      } catch {}
    }
    pointerId = null;
    persist();
    setStatus("Ready");
  });

  handle.addEventListener("pointercancel", () => {
    dragging = false;
    pointerId = null;
    persist();
    setStatus("Ready");
  });
}

function openProject(id) {
  const project = state.projects.find((p) => p.id === id);
  if (!project) return;

  state.selectedId = id;
  persist();
  renderProjects();
  renderPreview(project);
  setView("preview");
}

function deleteProject(id) {
  state.projects = state.projects.filter((p) => p.id !== id);
  if (state.selectedId === id) {
    state.selectedId = state.projects[0]?.id || null;
  }
  persist();
  renderProjects();
}

async function buildProject() {
  const prompt = els.promptInput.value.trim();
  if (!prompt) return;

  setStatus("Building...");
  els.buildBtn.disabled = true;
  els.buildBtn.textContent = "Building...";

  pushMemory("user", prompt);

  try {
    const data = await askAI(prompt);

    if (data.kind === "project" && data.code) {
      const project = {
        id: uid(),
        title: data.title || "Untitled App",
        summary: data.summary || prompt,
        code: data.code,
        x: 24 + Math.random() * 120,
        y: 24 + Math.random() * 120,
        createdAt: Date.now(),
      };

      state.projects.unshift(project);
      state.selectedId = project.id;

      pushMemory("assistant", `Created project: ${project.title}`);
      persist();
      renderProjects();
      openProject(project.id);
      setStatus("Created");
      els.promptInput.value = "";
      return;
    }

    const text = data.text || "No response";
    pushMemory("assistant", text);
    persist();
    setStatus("Chat");
    alert(text);
  } catch (error) {
    pushMemory("assistant", `ERROR: ${error.message}`);
    persist();
    setStatus("Error");
    alert(`Virhe: ${error.message}`);
  } finally {
    els.buildBtn.disabled = false;
    els.buildBtn.textContent = "Build";
    setTimeout(() => setStatus("Ready"), 900);
  }
}

function clearProjects() {
  if (!confirm("Tyhjennetäänkö kaikki projektit?")) return;
  state.projects = [];
  state.selectedId = null;
  persist();
  renderProjects();
  setStatus("Cleared");
  setTimeout(() => setStatus("Ready"), 900);
}

function bindQuickPrompts() {
  document.querySelectorAll("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      els.promptInput.value = btn.getAttribute("data-fill");
      els.promptInput.focus();
    });
  });
}

function wireTabs() {
  els.previewTabBtn.addEventListener("click", () => setView("preview"));
  els.codeTabBtn.addEventListener("click", () => setView("code"));
  els.copyBtn.addEventListener("click", async () => {
    const project = currentProject();
    if (!project?.code) return;
    try {
      await navigator.clipboard.writeText(project.code);
      setStatus("Copied");
      setTimeout(() => setStatus("Ready"), 1000);
    } catch {
      setStatus("Copy failed");
      setTimeout(() => setStatus("Ready"), 1200);
    }
  });
}

function init() {
  els.statusPill = $("statusPill");
  els.promptInput = $("promptInput");
  els.buildBtn = $("buildBtn");
  els.clearProjectsBtn = $("clearProjectsBtn");
  els.projectBoard = $("projectBoard");
  els.previewFrame = $("previewFrame");
  els.previewTitle = $("previewTitle");
  els.previewWrap = $("previewWrap");
  els.codeView = $("codeView");
  els.previewTabBtn = $("previewTabBtn");
  els.codeTabBtn = $("codeTabBtn");
  els.copyBtn = $("copyBtn");

  bindQuickPrompts();
  wireTabs();

  els.buildBtn.addEventListener("click", buildProject);
  els.clearProjectsBtn.addEventListener("click", clearProjects);
  els.promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buildProject();
  });

  if (!state.selectedId && state.projects[0]) {
    state.selectedId = state.projects[0].id;
  }

  persist();
  renderProjects();
  setView("preview");
  setStatus("Ready");
}

window.addEventListener("DOMContentLoaded", init);
