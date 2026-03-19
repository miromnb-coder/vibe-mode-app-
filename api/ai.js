export default async function handler(req, res) {
  const prompt = req.body.prompt;

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
You are an AR AI system.

Your job is to decide what app to create.

Respond ONLY in JSON.

Types:
- clock
- notes
- calculator
- ai

Examples:

User: tee kello
Response: { "type": "clock" }

User: tee muistiinpanot
Response: { "type": "notes" }

User: tee laskin
Response: { "type": "calculator" }

User: kerro vitsi
Response: { "type": "ai", "content": "vitsi tähän" }
`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content || "";

    res.status(200).json({ text });

  } catch (err) {
    res.status(200).json({ text: "error" });
  }
}
