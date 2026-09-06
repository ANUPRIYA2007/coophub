import dotenv from 'dotenv';
dotenv.config();

const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

async function testExtraction() {
  console.log("Testing Gemini 1.5 Flash Vision / Document Extraction...");
  const prompt = `You are the COOP HUB Document Extraction Engine. Extract structured data from this Indian Government Identity / Aadhaar Document:
Output JSON:
{
  "document_type": "Aadhaar",
  "full_name": "...",
  "document_number": "...",
  "date_of_birth": "...",
  "address": "...",
  "gender": "..."
}`;

  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
  for (const m of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
      });
      console.log(`Model ${m} status:`, res.status);
      if (res.ok) {
        const d = await res.json();
        console.log(`Model ${m} working:`, d.candidates?.[0]?.content?.parts?.[0]?.text);
        break;
      }
    } catch (e) {
      console.log(`Model ${m} error:`, e.message);
    }
  }

  const nvidiaModels = [
    "meta/llama-3.2-11b-vision-instruct",
    "meta/llama-3.2-90b-vision-instruct",
    "nvidia/nemotron-4-340b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-8b-instruct"
  ];

  for (const m of nvidiaModels) {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${NVIDIA_KEY}`
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "user", content: "Extract fields from Aadhaar. Reply in JSON." }]
        })
      });
      console.log(`NVIDIA Model ${m} status:`, res.status);
      if (res.ok) {
        const d = await res.json();
        console.log(`NVIDIA Model ${m} reply:`, d.choices?.[0]?.message?.content?.slice(0, 150));
      }
    } catch (e) {
      console.log(`NVIDIA Model ${m} error:`, e.message);
    }
  }
}

testExtraction();
