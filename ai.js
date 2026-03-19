async function generateApp(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CONFIG.API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You generate small web apps for AR glasses.
Return ONLY clean HTML.

User request: ${prompt}`
        }
      ]
    })
  });

  const data = await response.json();

  return data.content[0].text;
}
