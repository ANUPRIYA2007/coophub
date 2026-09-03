/**
 * COOP HUB — Unified Document Extraction & Processing Pipeline
 * 
 * Orchestrates the full document processing flow:
 * 1. Send document to server-side OCR endpoint (PaddleOCR -> EasyOCR -> NVIDIA Vision -> Gemini)
 * 2. Server returns: raw OCR text, clean text, structured fields, AI analysis
 * 3. Client-side fallback to direct Multimodal Vision AI if server is unavailable (silent Tesseract prohibited)
 * 4. Persist results via documentStorageService
 * 5. Return unified output for Admin Verification Workspace
 */

import { geminiDocumentService } from './geminiDocumentService.js';
import { documentValidationService } from './documentValidationService.js';
import { ocrService } from '../pillar/ocrService.js';
import { aiService } from './aiService.js';
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
        success: false,
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

    // Convert PDF page to high-res image for OCR
    let imagePayload = base64Data;
    if (typeof base64Data === 'string' && base64Data.startsWith('data:application/pdf')) {
      try {
        imagePayload = await convertPdfPageToImage(base64Data);
      } catch (pdfErr) {
        console.warn("PDF conversion note:", pdfErr.message);
      }
    }

    // Step 2: Send to server-side OCR pipeline (primary path)
    currentStatus = 'OCR_PROCESSING';
    onStatusUpdate(currentStatus);

    let serverResult = null;
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
        
        if (backendData.success) {
          serverResult = backendData;
          console.log('[DocumentExtraction] Server OCR succeeded:', {
            ocrChars: backendData.ocr?.cleanText?.length || 0,
            confidence: backendData.ocr?.confidence,
            detectedType: backendData.documentType,
            processingTimeMs: backendData.processingTimeMs
          });
        } else {
          console.warn('[DocumentExtraction] Server OCR reported failure:', backendData.stage, backendData.error);
          // If OCR itself failed, return the error — don't silently proceed
          if (backendData.stage === 'ocr' || backendData.stage === 'preprocessing') {
            onStatusUpdate('FAILED');
            return {
              success: false,
              document_processing_status: 'FAILED',
              error: backendData.error,
              stage: backendData.stage,
              ocr_raw_text: backendData.ocr?.rawText || '',
              ocr_confidence: backendData.ocr?.confidence || 0,
              processed_at: new Date().toISOString()
            };
          }
        }
      }
    } catch (proxyErr) {
      console.warn('[DocumentExtraction] Server endpoint unavailable, falling back to client OCR:', proxyErr.message);
    }

    // If server returned a full result (with legacy format), use it directly
    if (serverResult?.result) {
      currentStatus = 'AI_EXTRACTION';
      onStatusUpdate(currentStatus);

      // Step 3: Persist to Dedicated Document Table (if pillarId provided)
      let savedRecord = null;
      if (pillarProfile?.id) {
        try {
          const aiData = serverResult.result.ai_extracted_data || {};
          const saveRes = await documentStorageService.saveExtractedDocument({
            pillarId: pillarProfile.id,
            documentType: serverResult.documentType || expectedDocumentType,
            extractedData: aiData,
            rawOcrText: serverResult.ocr?.rawText || serverResult.result.ocr_raw_text || '',
            documentUrl: typeof document === 'string' ? document : null,
            validationResult: serverResult.result.validation_result || {}
          });
          if (saveRes.success) {
            savedRecord = saveRes;
          }
        } catch (saveErr) {
          console.warn("Storage to dedicated document table note:", saveErr.message);
        }
      }

      currentStatus = 'READY_FOR_REVIEW';
      onStatusUpdate(currentStatus);

      // Return in unified format (backward compatible)
      return {
        success: true,
        document_processing_status: 'READY_FOR_REVIEW',
        ocr_provider: serverResult.ocr?.engine || serverResult.result.ocr_provider,
        ocr_raw_text: serverResult.ocr?.rawText || serverResult.result.ocr_raw_text,
        ocr_clean_text: serverResult.ocr?.cleanText || '',
        ocr_confidence: serverResult.ocr?.confidence || 0,
        ai_provider: serverResult.ai?.provider || serverResult.result.ai_provider,
        ai_extracted_data: serverResult.result.ai_extracted_data,
        ai_confidence: serverResult.result.ai_confidence,
        confidence_level: serverResult.result.confidence_level,
        validation_result: serverResult.result.validation_result,
        mismatch_flags: serverResult.result.mismatch_flags,
        missing_fields: serverResult.result.missing_fields,
        warnings: serverResult.result.warnings,
        bounding_boxes: [],
        recommendation: serverResult.result.validation_result?.recommendation,
        summary: serverResult.result.validation_result?.recommendation === 'READY_FOR_APPROVAL'
          ? 'Document extracted and validated successfully.'
          : 'Document extracted. Manual review recommended.',
        dedicated_storage: savedRecord,
        processing_time_ms: serverResult.processingTimeMs || (Date.now() - startTime),
        processed_at: new Date().toISOString()
      };
    }

    // =====================================================
    // FALLBACK: Explicit OCR Provider Chain (when server is unavailable)
    // Chain: Direct Vision AI -> Gemini Reasoning
    // Policy: Silent Tesseract.js fallback is prohibited for production KYC
    // =====================================================
    console.log('[DocumentExtraction] Server OCR endpoint unavailable. Executing client-side fallback chain...');

    let ocrRawText = '';
    let ocrProvider = 'None';
    let visionResult = null;

    // 1. Attempt Client-Side Multimodal Vision AI directly
    try {
      visionResult = await aiService.extractDocumentWithVisionAI(imagePayload, expectedDocumentType);
      if (visionResult?.raw_visible_text || visionResult?.document_number) {
        ocrRawText = visionResult.raw_visible_text || '';
        ocrProvider = 'Multimodal Vision AI (NVIDIA NIM / Gemini Vision)';
      }
    } catch (visionErr) {
      console.warn('[DocumentExtraction] Vision AI fallback unavailable:', visionErr.message);
    }

    // 2. Isolated Legacy/Diagnostic Path (strictly non-production, requires explicit flag)
    if (!ocrRawText && typeof window !== 'undefined' && window.__COOP_ALLOW_DIAGNOSTIC_OCR__ === true) {
      console.warn('[DocumentExtraction] NOTICE: Executing non-production legacy diagnostic OCR worker...');
      try {
        const fallbackOcr = await ocrService.extractDocumentInformation(imagePayload, expectedDocumentType, pillarProfile, { isDiagnosticOnly: true });
        ocrRawText = fallbackOcr.raw_full_text || fallbackOcr.raw_text_snippet || '';
        ocrProvider = 'Tesseract.js (Non-Production Legacy/Diagnostic Only)';
      } catch (diagErr) {
        console.error('[DocumentExtraction] Diagnostic OCR failed:', diagErr.message);
      }
    }

    // FAIL FAST: If production OCR provider chain failed, do NOT silently invent fields
    if (!ocrRawText || ocrRawText.trim().length < 10) {
      onStatusUpdate('FAILED');
      return {
        success: false,
        document_processing_status: 'FAILED',
        error: 'Production OCR chain (PaddleOCR -> EasyOCR -> NVIDIA Vision) is unavailable. Silent Tesseract.js fallback is prohibited for production KYC.',
        ocr_chain: 'PaddleOCR (Primary) -> EasyOCR (Secondary) -> NVIDIA Vision -> Gemini',
        ocr_provider: ocrProvider,
        recommendation: 'MANUAL_REVIEW_REQUIRED',
        stage: 'ocr',
        ocr_raw_text: ocrRawText,
        processed_at: new Date().toISOString()
      };
    }

    // Step 3: Document Understanding & Field Extraction (client-side fallback)
    currentStatus = 'AI_EXTRACTION';
    onStatusUpdate(currentStatus);

    let structuredAiData = null;
    let aiProvider = 'Rule-Based Pattern Matcher';

    try {
      structuredAiData = await geminiDocumentService.structureDocument({
        rawText: ocrRawText,
        documentCategory,
        pillarProfile
      });
      aiProvider = structuredAiData.ai_model || aiProvider;
    } catch (aiErr) {
      console.warn("Document Understanding extraction notice:", aiErr.message);
      
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
        confidence: ocrRawText.length > 20 ? 0.75 : 0.40,
        mismatches: [],
        missing_fields: !parsed?.extractedDocNumber ? ['document_number'] : [],
        warnings: ocrRawText.length < 20 ? ['Document text unreadable or low resolution.'] : [],
        extracted_text: ocrRawText
      };
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
      bounding_boxes: [],
      recommendation: validationResult.recommendation,
      summary: validationResult.summary,
      dedicated_storage: savedRecord,
      processing_time_ms: Date.now() - startTime,
      processed_at: new Date().toISOString()
    };
  }
};

export default documentExtractionService;
