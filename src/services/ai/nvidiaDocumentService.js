/**
 * COOP HUB — NVIDIA Document AI Service
 * 
 * Primary Document Processing Engine using NVIDIA's specialized document model:
 * Model: nvidia/nemotron-parse
 * 
 * Responsibilities:
 * - OCR / Text Extraction
 * - Document structure & markdown generation
 * - Page-level extraction
 * - Layout-aware extraction
 * - Table / structured content parsing
 * - Bounding-box coordinate extraction (markdown_bbox)
 */

export const nvidiaDocumentService = {
  /**
   * Process an image / PDF page using NVIDIA Nemotron Parse
   * @param {string} base64Image - Base64 Data URL or raw base64 string
   * @param {string} apiKey - NVIDIA API key (defaults to env or passed key)
   */
  async extractDocumentStructure(base64Image, apiKey = null) {
    const key = apiKey !== null
      ? apiKey 
      : ((typeof process !== 'undefined' && process.env ? process.env.NVIDIA_API_KEY : null) || 
         (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_NVIDIA_API_KEY : null));

    const candidateModels = [
      (typeof process !== 'undefined' && process.env ? process.env.NVIDIA_OCR_MODEL : null) || 
      (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_NVIDIA_OCR_MODEL : null) || 
      'nvidia/nemotron-parse',
      'meta/llama-3.2-11b-vision-instruct',
      'meta/llama-3.2-90b-vision-instruct'
    ];

    if (!key) {
      throw new Error("NVIDIA_API_KEY is not configured.");
    }

    if (!base64Image) {
      throw new Error("No document image data provided for NVIDIA extraction.");
    }

    const formattedImageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    let lastError = null;
    for (const model of candidateModels) {
      try {
        const isNemotronParse = model.includes('nemotron-parse');
        const userContent = isNemotronParse
          ? [
              {
                type: "image_url",
                image_url: {
                  url: formattedImageUrl
                }
              }
            ]
          : [
              {
                type: "text",
                text: "You are an expert Document OCR and Identity Card Reader. Read every word, number, Aadhaar number, name, date of birth, address, and issuing details visible in this document image and transcribe it completely with 100% accuracy."
              },
              {
                type: "image_url",
                image_url: {
                  url: formattedImageUrl
                }
              }
            ];

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: userContent
              }
            ],
            temperature: 0.1,
            max_tokens: 1500
          })
        });

        if (response.status === 401) {
          throw new Error("NVIDIA API HTTP 401: Unauthorized / Invalid API Key");
        }

        if (response.ok) {
          const data = await response.json();
          const message = data.choices?.[0]?.message;

          let extractedMarkdown = message?.content || '';
          let boundingBoxes = [];

          // Parse Nemotron markdown_bbox tool calls if returned
          if (message?.tool_calls && message.tool_calls.length > 0) {
            for (const tool of message.tool_calls) {
              if (tool.function?.name === 'markdown_bbox' && tool.function?.arguments) {
                try {
                  const bboxData = JSON.parse(tool.function.arguments);
                  if (Array.isArray(bboxData)) {
                    boundingBoxes = bboxData;
                    if (!extractedMarkdown && Array.isArray(bboxData)) {
                      extractedMarkdown = bboxData.map(item => Array.isArray(item) && item[1] ? item[1] : '').join('\n');
                    }
                  }
                } catch (jsonErr) {}
              }
            }
          }

          if (extractedMarkdown && extractedMarkdown.trim().length > 0) {
            return {
              success: true,
              provider: `NVIDIA NIM (${model})`,
              model: model,
              raw_text: extractedMarkdown,
              bounding_boxes: boundingBoxes,
              usage: data.usage || null,
              processed_at: new Date().toISOString()
            };
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("NVIDIA Vision models could not process the document image.");
  }
};

export default nvidiaDocumentService;
