import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple native .env loader
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...vals] = trimmed.split("=");
        if (key && vals.length > 0) {
          process.env[key.trim()] = vals.join("=").trim();
        }
      }
    });
  }
}

loadEnv();

const PORT = process.env.PORT || 5000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";
const NVIDIA_MODEL = (process.env.NVIDIA_MODEL && !process.env.NVIDIA_MODEL.includes("nemotron-parse"))
  ? process.env.NVIDIA_MODEL 
  : "meta/llama-3.2-11b-vision-instruct";

// Helper: Call NVIDIA Chat API
async function callNvidia(prompt, systemPrompt, language) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        {
          role: "system",
          content: `${systemPrompt} Language: ${language === "ta" ? "Tamil" : language === "hi" ? "Hindi" : language === "te" ? "Telugu" : language === "kn" ? "Kannada" : "English"}.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 450,
    });

    const req = https.request(
      {
        hostname: "integrate.api.nvidia.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 12000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.message?.content;
              if (text) {
                return resolve(text.trim());
              }
            } catch (e) {
              return reject(e);
            }
          }
          reject(new Error(`NVIDIA returned HTTP ${res.statusCode}: ${data.slice(0, 150)}`));
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("NVIDIA request timed out"));
    });
    req.write(postData);
    req.end();
  });
}

// Helper: Call Google Gemini API
async function callGemini(prompt, systemPrompt, language) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt} In ${language === "ta" ? "Tamil" : language === "hi" ? "Hindi" : "English"}: ${prompt}`,
            },
          ],
        },
      ],
    });

    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 12000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                return resolve(text.trim());
              }
            } catch (e) {
              return reject(e);
            }
          }
          reject(new Error(`Gemini returned HTTP ${res.statusCode}: ${data.slice(0, 150)}`));
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Gemini request timed out"));
    });
    req.write(postData);
    req.end();
  });
}

// Native HTTP Server with full CORS & JSON handling
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === "/api/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  // AI Chat Proxy Route
  if (req.url === "/api/ai/chat" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { prompt, language = "en", route = "/" } = JSON.parse(body || "{}");

        if (!prompt || typeof prompt !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Prompt is required" }));
          return;
        }

        const authoritativeSystemPrompt = `You are CoopBot, the official 24/7 AI mascot and guide for the COOP HUB Pillar Portal.
The user is currently viewing the ${route} page.
Rules:
1. Provide helpful, polite, and practical guidance for service technicians and technicians joining the platform.
2. NEVER generate, suggest, or execute arbitrary SQL queries.
3. NEVER reveal or invent private user orders, financial earnings, or account credentials.
4. Keep replies concise, clean, and well-structured.`;

        // 1. Primary: NVIDIA
        try {
          const nvidiaText = await callNvidia(prompt, authoritativeSystemPrompt, language);
          if (nvidiaText) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: true,
                text: nvidiaText,
                provider: "nvidia",
              })
            );
            return;
          }
        } catch (nvidiaErr) {
          console.warn("Primary AI provider (NVIDIA) failed:", nvidiaErr.message);
        }

        // 2. Fallback: Gemini
        try {
          const geminiText = await callGemini(prompt, authoritativeSystemPrompt, language);
          if (geminiText) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: true,
                text: geminiText,
                provider: "gemini",
              })
            );
            return;
          }
        } catch (geminiErr) {
          console.warn("Fallback AI provider (Gemini) failed:", geminiErr.message);
        }

        // 3. Both Failed
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: "AI providers unavailable",
          })
        );
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // AI Pillar Registration Summary Route
  if (req.url === "/api/ai/summarize-pillar" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { pillar, ocrData, autoVerifyResult } = JSON.parse(body || "{}");
        const systemPrompt = `You are the COOP HUB Central Administrative AI Verification Officer.
Analyze this technician applicant's registration details, OCR extraction data, and trade credentials.
Output ONLY a valid JSON object without code blocks:
{
  "executive_summary": "2 concise sentences summarizing applicant's trade skills, experience, and zone viability.",
  "document_authenticity": {
    "document_type": "string",
    "status": "VERIFIED_ACCURATE or MANUAL_INSPECTION_RECOMMENDED",
    "notes": "Evaluation of document format, OCR text matching, and name alignment."
  },
  "trade_competency": {
    "rating": "Master Technician (X Yrs) or Skilled Technician or Apprentice",
    "skills_coverage": "Specific trade capabilities",
    "viability": "Local market demand evaluation for the selected zone"
  },
  "risk_assessment": {
    "level": "LOW_RISK or MEDIUM_RISK or HIGH_RISK",
    "color": "#10B981 for low, #F59E0B for medium, #EF4444 for high",
    "flags": ["List of 2-3 specific audit check notes"]
  },
  "recommendation": {
    "decision": "APPROVED_RECOMMENDED or REVIEW_REQUIRED or REJECT_RECOMMENDED",
    "rationale": "Clear administrative reasoning for approval or further review."
  }
}`;
        const userPrompt = JSON.stringify({ pillar, ocrData, autoVerifyResult });

        let rawText = null;
        let provider = "NVIDIA";
        try {
          rawText = await callNvidia(userPrompt, systemPrompt, "en");
        } catch (e) {
          try {
            rawText = await callGemini(userPrompt, systemPrompt, "en");
            provider = "Gemini";
          } catch (ge) {
            console.error("AI Summary generation failed:", ge);
          }
        }

        if (rawText) {
          const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const analysis = JSON.parse(clean);
          analysis.ai_provider = provider;
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, analysis }));
          return;
        }

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "AI summary generation failed" }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Pillar AI Secure Backend running natively on http://localhost:${PORT}`);
});
