// 🔥 BACKEND AI
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

// 📦 UI kortti
function addApp(title, content) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${title}</strong><br>${content}`;
  document.getElementById("apps").appendChild(div);
}

// 👓 AR overlay
function createARApp(title, content) {
  const layer = document.getElementById("ar-layer");

  const box = document.createElement("div");
  box.className = "ar-box";

  box.style.top = Math.random() * 70 + "%";
  box.style.left = Math.random() * 70 + "%";

  box.innerHTML = `<strong>${title}</strong><br>${content}`;
  layer.appendChild(box);
}

// 🧠 PÄÄLOGIIKKA
async function runHalo(input) {

  try {
    const ai = await askAI(input);

    addApp("🤖 AI", ai);
    createARApp("AI", ai);

    return;

  } catch (e) {
    console.log("AI error");
  }

  // fallback
  if (input.includes("time")) {
    const t = new Date().toLocaleTimeString();
    createARApp("⏰ Clock", t);
  } else {
    createARApp("⚠️", "Ei tunnistettu");
  }
}

// ▶️ nappi
function start() {
  const input = document.getElementById("input").value;
  runHalo(input);
}

// 🎤 puhe
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "fi-FI";

  recognition.onresult = function(event) {
    const text = event.results[0][0].transcript;
    runHalo(text);
  };

  recognition.start();
}
