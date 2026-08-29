import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.NVIDIA_API_KEY;

async function testNvidiaModels() {
  for (const model of ['meta/llama-3.1-8b-instruct', 'meta/llama-3.2-3b-instruct', 'meta/llama-3.2-11b-vision-instruct']) {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with JSON: {\"status\": \"ok\", \"model\": \"" + model + "\"}" }],
          max_tokens: 200
        })
      });
      console.log(`NVIDIA Model ${model} status:`, res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Reply:", data.choices?.[0]?.message?.content);
        break;
      }
    } catch (e) {
      console.log(`Error on ${model}:`, e.message);
    }
  }
}

testNvidiaModels();
