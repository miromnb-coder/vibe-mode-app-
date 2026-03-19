async function askAI(prompt) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  return data.text;
}

// 👓 UI generator
function createBox(html) {
  const layer = document.getElementById("ar-layer");

  const box = document.createElement("div");
  box.className = "ar-box";

  box.style.top = Math.random() * 70 + "%";
  box.style.left = Math.random() * 70 + "%";

  box.innerHTML = html;
  layer.appendChild(box);
}

// 🧩 apps
function clockApp() {
  const box = document.createElement("div");
  box.className = "ar-box";

  function update() {
    box.innerHTML = `<div class="title">⏰ CLOCK</div><div>${new Date().toLocaleTimeString()}</div>`;
  }

  setInterval(update, 1000);
  update();

  document.getElementById("ar-layer").appendChild(box);
}

function notesApp() {
  createBox(`
    <div class="title">📝 NOTES</div>
    <textarea class="glass-input"></textarea>
  `);
}

function calcApp() {
  createBox(`
    <div class="title">➕ CALC</div>
    <input id="calc" class="glass-input" />
    <button onclick="runCalc()">=</button>
    <div id="calcResult"></div>
  `);
}

function runCalc() {
  const val = document.getElementById("calc").value;
  try {
    document.getElementById("calcResult").innerText = eval(val);
  } catch {
    document.getElementById("calcResult").innerText = "error";
  }
}

// 🤖 MAIN
async function runHalo(input) {

  const raw = await askAI(input);

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    createBox("⚠️ AI virhe");
    return;
  }

  if (data.type === "clock") return clockApp();
  if (data.type === "notes") return notesApp();
  if (data.type === "calculator") return calcApp();

  if (data.type === "ai") {
    createBox(`<div class="title">🤖 AI</div>${data.content}`);
  }
}

function start() {
  const input = document.getElementById("input").value;
  runHalo(input);
}

function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "fi-FI";

  recognition.onresult = function(event) {
    runHalo(event.results[0][0].transcript);
  };

  recognition.start();
}
