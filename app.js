const layer = document.getElementById("ar-layer");

// 💾 memory + projects
let memory = JSON.parse(localStorage.getItem("memory") || "[]");
let projects = JSON.parse(localStorage.getItem("projects") || "[]");

function save() {
  localStorage.setItem("memory", JSON.stringify(memory));
  localStorage.setItem("projects", JSON.stringify(projects));
}

// 🤖 AI
async function askAI(prompt) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ prompt, memory })
  });

  const data = await res.json();
  return data.text;
}

// 💬 chat
function addMessage(text, type="ai") {
  const el = document.createElement("div");
  el.className = "chat " + type;
  el.innerText = text;

  el.style.top = Math.random()*60 + "%";
  el.style.left = Math.random()*60 + "%";

  layer.appendChild(el);
}

// 🧩 drag
function makeDraggable(el) {
  let offsetX, offsetY;

  el.onmousedown = (e) => {
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;

    document.onmousemove = (e) => {
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
    };

    document.onmouseup = () => {
      document.onmousemove = null;
    };
  };
}

// 🧠 render app
function renderApp(app) {
  const box = document.createElement("div");
  box.className = "ar-box";

  box.innerHTML = `
    <div class="title">${app.title}</div>
    ${app.code}
  `;

  box.style.top = Math.random()*60 + "%";
  box.style.left = Math.random()*60 + "%";

  makeDraggable(box);
  layer.appendChild(box);
}

// 🚀 MAIN
async function start() {
  const input = document.getElementById("input").value;

  memory.push({role:"user", content:input});
  save();

  addMessage(input, "user");

  const raw = await askAI(input);

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    addMessage(raw, "ai");
    return;
  }

  if (data.type === "app") {
    projects.push(data);
    save();

    renderApp(data);
    addMessage("App luotu: " + data.title, "ai");
  }
}

// 📦 show projects
function showProjects() {
  layer.innerHTML = "";

  projects.forEach(p => renderApp(p));
}

// 🧹 clear
function clearScreen() {
  layer.innerHTML = "";
}
