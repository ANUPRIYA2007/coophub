import fs from 'fs';
import dotenv from 'dotenv';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

dotenv.config();

const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

async function extractAadharDirect() {
  const filePath = 'D:/Documents/RISHI CERTIFICATES & DOCUMENTS/AADHAR.pdf';
  console.log('Reading PDF:', filePath);

  const fileBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(fileBuffer);

  console.log('Loading PDF with pdfjs...');
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDoc = await loadingTask.promise;
  console.log(`PDF loaded! Total pages: ${pdfDoc.numPages}`);

  let fullPdfText = '';
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    console.log(`\n--- PAGE ${pageNum} RAW EMBEDDED TEXT CONTENT ---`);
    console.log(pageText);
    fullPdfText += `\n[Page ${pageNum}]\n` + pageText;
  }

  console.log('\n======================================================');
  console.log('  RUNNING NVIDIA AI MULTIMODAL EXTRACTION ON DOCUMENT ');
  console.log('======================================================\n');

  const prompt = `You are an expert Document Inspection AI. Analyze this Indian Aadhaar Document Text and extract structured identity fields:
Document Text:
"""
${fullPdfText}
"""

Output strictly valid JSON:
{
  "document_type": "Aadhaar Card",
  "full_name": "Full Name printed on document",
  "aadhaar_number": "12-digit Aadhaar number (XXXX XXXX XXXX)",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "MALE | FEMALE | OTHER",
  "address": "Full residential address",
  "pincode": "6-digit PIN code",
  "fathers_or_guardians_name": "Father / Husband / Care of name if present",
  "confidence_score": 0.98,
  "raw_visible_text": "Complete transcribed text snippet"
}`;

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_KEY}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          { role: "system", content: "You are the COOP HUB Document Extraction AI. Extract structured data accurately without making up values." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1500
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content;
      console.log('\n--- NVIDIA AI STRUCTURED EXTRACTION OUTPUT ---');
      console.log(aiReply);
    } else {
      console.error('NVIDIA API error status:', response.status);
    }
  } catch (err) {
    console.error('AI call failed:', err.message);
  }
}

extractAadharDirect();
