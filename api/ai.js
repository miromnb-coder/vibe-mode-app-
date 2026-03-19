export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message, history } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // toimii nyt
        messages: [
          {
            role: "system",
            content: `
You are Halo AI Builder.

You generate REAL app ideas + UI structures.

When user asks something:
- Respond like a futuristic AI
- Generate UI components
- Suggest features
- Be creative

Also return structured ideas like:

APP:
- name
- features
- UI layout
- next steps
`
          },
          ...(history || []),
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
