import { isOllamaAvailable, chatWithOllama } from './src/lib/ollama';

async function test() {
  console.log("Checking availability...");
  const available = await isOllamaAvailable();
  console.log("Available:", available);
  if (available) {
    const res = await chatWithOllama("hola", [], {
     companyId: "123", companyName: "Test", userId: "abc", userName: "Flash", userRole: "Admin", currentDate: "Hoy"
    });
    console.log(res);
  }
}

test().catch(console.error);
