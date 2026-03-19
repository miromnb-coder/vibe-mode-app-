// 🔥 AI kysely backendiin
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

// 👓 Näyttää appin ruudulla
function addApp(title, content) {
  const container = document.getElementById("apps");

  const div = document.createElement("div");
  div.style.background = "black";
  div.style.color = "lime";
  div.style.padding = "10px";
  div.style.margin = "10px";
  div.style.borderRadius = "10px";

  div.innerHTML = `<strong>${title}</strong><br>${content}`;

  container.appendChild(div);
}

// 🎤 Pää AI + fallback logiikka
async function runHalo(input) {

  // 🤖 Yritä AI
  try {
    const ai = await askAI(input);
    addApp("🤖 AI", ai);
    return;
  } catch (e) {
    console.log("AI error", e);
  }

  // ⏰ fallback
  if (input.toLowerCase().includes("time")) {
    addApp("⏰ Time", new Date().toLocaleTimeString());
  } else {
    addApp("⚠️", "AI ei toimi vielä");
  }
}

// 🎤 nappi trigger
function start() {
  const input = document.getElementById("input").value;
  runHalo(input);
}
