import dotenv from 'dotenv';
dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";

async function testAi() {
  const prompt = "what are the things i need to carry for a water leakage problem";
  const systemPrompt = "You are CoopBot, the expert AI Assistant for certified cooperative technicians (Pillars) in Chennai. Provide a direct, practical, and helpful answer for technicians.";

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${NVIDIA_API_KEY}`
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  console.log("NVIDIA Status:", response.status);
  const data = await response.json();
  console.log("NVIDIA Response:", data.choices?.[0]?.message?.content);
}

testAi();
