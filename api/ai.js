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
        model: "llama3-8b-8192",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    // 🔥 DEBUG (näyttää virheen suoraan)
    if (!data.choices) {
      return res.status(200).json({
        choices: [{
          message: { content: "ERROR: " + JSON.stringify(data) }
        }]
      });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(200).json({
      choices: [{
        message: { content: "SERVER ERROR" }
      }]
    });
  }
}
