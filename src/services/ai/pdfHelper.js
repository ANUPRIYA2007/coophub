/**
 * COOP HUB — Client-Side & Server PDF to Image Converter
 * Converts uploaded PDF document pages into high-resolution JPEG Data URLs for Vision AI OCR
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure standard worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

/**
 * Convert the first page of a PDF Data URL or ArrayBuffer to a high-resolution JPEG Data URL
 * @param {string|ArrayBuffer} pdfData - Base64 Data URL or raw binary buffer
 * @returns {Promise<string>} Base64 JPEG data URL
 */
export async function convertPdfPageToImage(pdfData) {
  if (!pdfData) return null;

  // If already an image, return as is
  if (typeof pdfData === 'string' && (pdfData.startsWith('data:image/') || !pdfData.startsWith('data:application/pdf'))) {
    return pdfData;
  }

  try {
    let rawBinary = pdfData;
    if (typeof pdfData === 'string' && pdfData.startsWith('data:application/pdf;base64,')) {
      const base64Str = pdfData.replace('data:application/pdf;base64,', '');
      const binaryString = atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      rawBinary = bytes.buffer;
    }

    const loadingTask = pdfjsLib.getDocument({ data: rawBinary });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(1);

    const scale = 2.0; // High resolution rendering for accurate OCR
    const viewport = page.getViewport({ scale });

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL('image/jpeg', 0.95);
    }
  } catch (err) {
    console.warn("Client PDF-to-Image render notice:", err.message);
  }

  return pdfData;
}
