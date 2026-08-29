import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const geminiKey = process.env.GEMINI_API_KEY;

function extractJsonFromText(text = '') {
  if (!text) throw new Error("Empty text");
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const jsonSubstring = text.slice(start, end + 1);
    return JSON.parse(jsonSubstring);
  }
  throw new Error("No valid JSON object found");
}

async function debugGemma() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: "Extract JSON strictly from: GOVERNMENT OF INDIA, AADHAAR CARD, Name: Anupriya Rajaraman, DOB: 07/08/1995, Aadhaar No: 9840 1234 5678.\nOutput strictly valid JSON with keys: document_type, full_name, date_of_birth, document_number, confidence." }
          ]
        }
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 600 }
    })
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = extractJsonFromText(text);
  console.log("Successfully parsed JSON:", parsed);
}

debugGemma();
