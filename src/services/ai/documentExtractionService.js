/**
 * COOP HUB — Unified Document Extraction & Processing Pipeline
 * 
 * Orchestrates the full AI Architecture:
 * 1. Document Input & Preprocessing (PDF / Image)
 * 2. NVIDIA Document AI (nvidia/nemotron-parse) for OCR & Structure
 * 3. Gemini Document Understanding for Structured Field Extraction
 * 4. Deterministic Validation Engine for Profile Alignment & Confidence Scoring
 * 5. Structured Output Generation for Admin Verification Workspace
 */

import { nvidiaDocumentService } from './nvidiaDocumentService.js';
import { geminiDocumentService } from './geminiDocumentService.js';
import { documentValidationService } from './documentValidationService.js';
import { ocrService } from '../pillar/ocrService.js';
import { convertPdfPageToImage } from './pdfHelper.js';
import { documentStorageService } from '../pillar/documentStorageService.js';

export const documentExtractionService = {
  /**
   * Run full document extraction and validation pipeline
   * @param {object} params
   * @param {string|File} params.document - Base64 Data URL, Image file, or PDF
   * @param {string} params.documentCategory - 'identity' | 'skill_certificate'
   * @param {string} params.expectedDocumentType - e.g. 'aadhaar', 'pan', 'iti', etc.
   * @param {object} params.pillarProfile - Registered Pillar profile
   * @param {function} params.onStatusUpdate - Status callback (e.g. OCR_PROCESSING, AI_EXTRACTION)
   */
  async processDocument({
    document,
    documentCategory = 'identity',
    expectedDocumentType = 'aadhaar',
    pillarProfile = {},
    onStatusUpdate = () => {}
  }) {
    const startTime = Date.now();
    let currentStatus = 'PROCESSING';
    onStatusUpdate(currentStatus);

    if (!document) {
      return {
        status: 'FAILED',
        error: 'No document data provided.',
        processed_at: new Date().toISOString()
      };
    }

    // Step 1: Preprocessing & Data URL standardization
    let base64Data = document;
    if (typeof document !== 'string' && document instanceof Blob) {
      base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(document);
      });
    }

    // Convert PDF page to high-res image for Vision AI
    let imagePayload = base64Data;
    if (typeof base64Data === 'string' && base64Data.startsWith('data:application/pdf')) {
      try {
        imagePayload = await convertPdfPageToImage(base64Data);
      } catch (pdfErr) {
        console.warn("PDF conversion note:", pdfErr.message);
      }
    }

    // Step 2: NVIDIA Document AI OCR & Layout Extraction
    currentStatus = 'OCR_PROCESSING';
    onStatusUpdate(currentStatus);

    let nvidiaResult = null;
    let ocrRawText = '';
    let boundingBoxes = [];
    let ocrProvider = 'NVIDIA NIM (Llama 3.2 Vision)';

    try {
      // First attempt: Backend Proxy (to ensure API keys remain hidden on server)
      try {
        const proxyRes = await fetch('/api/ai/process-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document: imagePayload,
            documentCategory,
            expectedDocumentType,
            pillarProfile
          })
        });

        if (proxyRes.ok) {
          const backendData = await proxyRes.json();
          if (backendData.success && backendData.result) {
            return backendData.result;
          }
        }
      } catch (proxyErr) {
        // Backend proxy offline/fallback to client direct engine
      }

      // Direct NVIDIA Vision / Nemotron Parse call
      nvidiaResult = await nvidiaDocumentService.extractDocumentStructure(imagePayload);
      ocrRawText = nvidiaResult.raw_text || '';
      boundingBoxes = nvidiaResult.bounding_boxes || [];
      ocrProvider = nvidiaResult.provider || ocrProvider;
    } catch (nvidiaErr) {
      console.warn("NVIDIA Vision extraction fallback:", nvidiaErr.message);
      // Fallback: Tesseract OCR Engine
      try {
        const fallbackOcr = await ocrService.extractDocumentInformation(imagePayload, expectedDocumentType, pillarProfile);
        ocrRawText = fallbackOcr.raw_full_text || fallbackOcr.raw_text_snippet || '';
        ocrProvider = fallbackOcr.engine || 'Optical Character Recognition (OCR v4.0)';
      } catch (tessErr) {
        console.error("All OCR providers failed:", tessErr.message);
      }
    }

    // Step 3: Document Understanding & Field Extraction
    currentStatus = 'AI_EXTRACTION';
    onStatusUpdate(currentStatus);

    let structuredAiData = null;
    let aiProvider = 'NVIDIA Document Intelligence';

    try {
      structuredAiData = await geminiDocumentService.structureDocument({
        rawText: ocrRawText,
        documentCategory,
        pillarProfile
      });
      aiProvider = structuredAiData.ai_model || aiProvider;
    } catch (aiErr) {
      console.warn("Document Understanding extraction notice:", aiErr.message);
      
      // Real heuristic parser on actual raw OCR text
      const parsed = ocrService.parseIndianIdFromText 
        ? ocrService.parseIndianIdFromText(ocrRawText, expectedDocumentType, pillarProfile)
        : null;

      structuredAiData = {
        document_type: expectedDocumentType,
        document_category: documentCategory,
        full_name: parsed?.extractedName || null,
        date_of_birth: parsed?.extractedDob || null,
        document_number: parsed?.extractedDocNumber || null,
        address: parsed?.extractedAddress || null,
        confidence: ocrRawText.length > 20 ? 0.90 : 0.40,
        mismatches: [],
        missing_fields: !parsed?.extractedDocNumber ? ['document_number'] : [],
        warnings: ocrRawText.length < 20 ? ['Document text unreadable or low resolution; visual inspection required.'] : [],
        extracted_text: ocrRawText
      };
      aiProvider = 'Rule-Based Pattern Matcher';
    }

    // Step 4: Deterministic Validation Engine
    currentStatus = 'VALIDATING';
    onStatusUpdate(currentStatus);

    const validationResult = documentValidationService.validateExtraction(
      structuredAiData,
      pillarProfile
    );

    // Step 5: Persist to Dedicated Document Table (if pillarId provided)
    let savedRecord = null;
    if (pillarProfile?.id) {
      try {
        const saveRes = await documentStorageService.saveExtractedDocument({
          pillarId: pillarProfile.id,
          documentType: expectedDocumentType,
          extractedData: structuredAiData,
          rawOcrText: ocrRawText,
          documentUrl: typeof document === 'string' ? document : null,
          validationResult
        });
        if (saveRes.success) {
          savedRecord = saveRes;
        }
      } catch (saveErr) {
        console.warn("Storage to dedicated document table note:", saveErr.message);
      }
    }

    // Step 6: Finalize and Assemble Unified Output
    currentStatus = 'READY_FOR_REVIEW';
    onStatusUpdate(currentStatus);

    return {
      success: true,
      document_processing_status: currentStatus,
      ocr_provider: ocrProvider,
      ocr_raw_text: ocrRawText,
      ai_provider: aiProvider,
      ai_extracted_data: structuredAiData,
      ai_confidence: validationResult.confidence_score,
      confidence_level: validationResult.confidence_level,
      validation_result: validationResult,
      mismatch_flags: validationResult.mismatches,
      missing_fields: validationResult.missing_fields,
      warnings: validationResult.warnings,
      bounding_boxes: boundingBoxes,
      recommendation: validationResult.recommendation,
      summary: validationResult.summary,
      dedicated_storage: savedRecord,
      processing_time_ms: Date.now() - startTime,
      processed_at: new Date().toISOString()
    };
  }
};

export default documentExtractionService;
