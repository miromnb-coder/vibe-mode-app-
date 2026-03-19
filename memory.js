let memory = [];

function saveMemory(text) {
  memory.push(text);
}

function getMemory() {
  return memory.join(", ");
}
