export default async function handler(req, res) {
  const { prompt, memory } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.GROQ_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You build mini apps.

Return JSON only.

FORMAT:
{
  "type": "app",
  "title": "name",
  "code": "<input><button onclick='...'>"
}
`
          },
          ...memory,
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    res.status(200).json({ text });

  } catch {
    res.status(200).json({ text: "error" });
  }
}
