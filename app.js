// 🔥 AI backend
async function askAI(prompt) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Ei vastausta";
}

// 👓 AR box creator
function createARApp(title, content) {
  const layer = document.getElementById("ar-layer");

  const box = document.createElement("div");
  box.className = "ar-box";

  box.style.top = Math.random() * 70 + "%";
  box.style.left = Math.random() * 70 + "%";

  box.innerHTML = `<strong>${title}</strong><br>${content}`;

  layer.appendChild(box);
}

// ⏰ CLOCK APP
function createClock() {
  const layer = document.getElementById("ar-layer");

  const box = document.createElement("div");
  box.className = "ar-box";

  box.style.top = "20%";
  box.style.left = "20%";

  function update() {
    box.innerHTML = "⏰ " + new Date().toLocaleTimeString();
  }

  setInterval(update, 1000);
  update();

  layer.appendChild(box);
}

// 📝 NOTES APP
function createNotes() {
  const layer = document.getElementById("ar-layer");

  const box = document.createElement("div");
  box.className = "ar-box";

  box.style.top = "40%";
  box.style.left = "20%";

  box.innerHTML = `
    📝 Notes<br>
    <textarea style="width:150px;height:80px;background:black;color:#00ffc8;"></textarea>
  `;

  layer.appendChild(box);
}

// ➕ CALCULATOR APP
function createCalculator() {
  const layer = document.getElementById("ar-layer");

  const box = document.createElement("div");
  box.className = "ar-box";

  box.style.top = "60%";
  box.style.left = "20%";

  box.innerHTML = `
    ➕ Calc<br>
    <input id="calc" style="width:100px;background:black;color:#00ffc8;" />
    <button onclick="runCalc()">=</button>
    <div id="calcResult"></div>
  `;

  layer.appendChild(box);
}

// calc logic
function runCalc() {
  const val = document.getElementById("calc").value;
  try {
    document.getElementById("calcResult").innerText = eval(val);
  } catch {
    document.getElementById("calcResult").innerText = "error";
  }
}

// 🧠 MAIN AI + GENERATOR
async function runHalo(input) {

  const text = input.toLowerCase();

  // 🔥 APP GENERATION
  if (text.includes("kello")) {
    createClock();
    return;
  }

  if (text.includes("muistiinpan")) {
    createNotes();
    return;
  }

  if (text.includes("laskin")) {
    createCalculator();
    return;
  }

  // 🤖 AI fallback
  try {
    const ai = await askAI(input);
    createARApp("🤖 AI", ai);
  } catch {
    createARApp("⚠️", "AI ei toimi");
  }
}

// ▶️ button
function start() {
  const input = document.getElementById("input").value;
  runHalo(input);
}

// 🎤 voice
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "fi-FI";

  recognition.onresult = function(event) {
    const text = event.results[0][0].transcript;
    runHalo(text);
  };

  recognition.start();
}
