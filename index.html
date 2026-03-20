import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const buildApp = async () => {
    setLoading(true);
    setCode("");
    setPreview("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();

      let raw = data.text || "No code";

      // 🔥 FIX: poista markdown ilman rikkinäistä regexiä
      raw = raw.replace(/```html/g, "");
      raw = raw.replace(/```javascript/g, "");
      raw = raw.replace(/```/g, "");

      setCode(raw);

      // 🔥 näytä app preview
      setPreview(raw);

    } catch (err) {
      setCode("ERROR: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🚀 Halo Builder V2</h1>

      <input
        style={styles.input}
        placeholder="Kuvaile app... (esim. todo app drag & dropilla)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button style={styles.button} onClick={buildApp}>
        {loading ? "Building..." : "Build"}
      </button>

      {/* 🔥 APP PREVIEW */}
      {preview && (
        <div style={styles.previewBox}>
          <iframe
            srcDoc={preview}
            style={styles.iframe}
            title="preview"
          />
        </div>
      )}

      {/* 🔥 CODE OUTPUT */}
      <pre style={styles.code}>
        {code || "No code yet"}
      </pre>
    </div>
  );
}

const styles = {
  page: {
    background: "black",
    minHeight: "100vh",
    color: "#00ffc3",
    padding: 20,
    fontFamily: "monospace"
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    marginBottom: 20
  },
  input: {
    width: "100%",
    padding: 15,
    background: "black",
    border: "1px solid #00ffc3",
    color: "#00ffc3",
    marginBottom: 10
  },
  button: {
    padding: 12,
    width: "100%",
    background: "#00ffc3",
    color: "black",
    border: "none",
    cursor: "pointer",
    marginBottom: 20
  },
  previewBox: {
    border: "1px solid #00ffc3",
    marginBottom: 20
  },
  iframe: {
    width: "100%",
    height: 400,
    border: "none",
    background: "white"
  },
  code: {
    background: "#111",
    padding: 10,
    whiteSpace: "pre-wrap"
  }
};
