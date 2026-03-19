export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `
You are an elite AI App Builder.

User gives idea → you return FULL WORKING APP CODE.

Rules:
- Return ONLY code
- Use this format:

---HTML---
<html>...</html>

---CSS---
body {...}

---JS---
console.log("app");

Make apps modern and clean.
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No code"
    });

  } catch (err) {
    res.status(200).json({
      reply: "ERROR: " + err.message
    });
  }
}
