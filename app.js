const output = document.getElementById("output");

async function createApp() {
  const input = document.getElementById("prompt").value;

  output.innerHTML = "Generating...";

  try {
    const result = await generateApp(input);
    output.innerHTML = result;
  } catch (err) {
    output.innerHTML = "Error: " + err.message;
  }
}
