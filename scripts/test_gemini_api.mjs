import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const geminiKey = process.env.GEMINI_API_KEY;

async function testGemma() {
  for (const model of ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-4-31b-it', 'gemini-flash-latest']) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello! Reply with JSON: {\"status\": \"active\", \"model\": \"" + model + "\"}" }] }]
        })
      });
      console.log(`Model ${model} status:`, res.status);
      if (res.ok) {
        const data = await res.json();
        console.log(`Model ${model} reply:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
        break;
      }
    } catch (e) {
      console.log(`Model ${model} error:`, e.message);
    }
  }
}

testGemma();
