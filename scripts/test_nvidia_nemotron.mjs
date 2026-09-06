import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.NVIDIA_API_KEY;
const model = "nvidia/nemotron-parse";

// 1x1 transparent PNG / test image data URL
const sampleBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

console.log("Testing NVIDIA Nemotron Parse with image payload...");

async function testNemotronImage() {
  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: sampleBase64Image
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    console.log("HTTP Status:", response.status, response.statusText);
    const body = await response.text();
    console.log("Response Body:", body);
  } catch (err) {
    console.error("Test error:", err);
  }
}

testNemotronImage();
