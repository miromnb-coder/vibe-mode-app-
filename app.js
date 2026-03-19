function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";

  recognition.onstart = () => {
    document.getElementById("status").innerText = "● LISTENING";
  };

  recognition.onresult = function(event) {
    const text = event.results[0][0].transcript;
    document.getElementById("text").innerText = text;

    saveMemory(text);
    runHalo(text.toLowerCase());
  };

  recognition.onend = () => {
    document.getElementById("status").innerText = "● READY";
  };

  recognition.start();
}

function runHalo(input) {

  if (input.includes("remember")) {
    addApp("🧠 Memory", getMemory());
  }

  else if (input.includes("time")) {
    addApp("⏰ Time", new Date().toLocaleTimeString());
  }

  else if (input.includes("note")) {
    addApp("📝 Note saved", input);
  }

  else if (input.includes("color")) {
    document.body.style.background = "blue";
  }

  else {
    addApp("🤖 Response", "Command not recognized");
  }
}

function addApp(title, content) {
  const div = document.createElement("div");
  div.className = "app";
  div.innerHTML = `<h3>${title}</h3><p>${content}</p>`;
  document.getElementById("apps").appendChild(div);
}
