import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = "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";
const model = "nvidia/nemotron-parse";

// Test with a sample document data URL
async function testNemotronDocument() {
  console.log("Testing NVIDIA Nemotron Parse with document image...");
  try {
    // Generate a simple test document base64 image (PNG with text rendered if needed, or sample PNG)
    const testDocBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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
                  url: testDocBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1024
      })
    });

    console.log("Nemotron status:", response.status);
    const data = await response.json();
    console.log("Full Nemotron Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Nemotron document error:", err);
  }
}

testNemotronDocument();
