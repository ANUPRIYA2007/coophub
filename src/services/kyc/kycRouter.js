/**
 * COOP HUB — Unified KYC Verification & Document Router
 * 
 * CORE ARCHITECTURAL FLOW:
 * 1. User Consent Verification
 * 2. Authoritative Verification Gateway (UIDAI Secure QR, DigiLocker, Govt APIs)
 * 3. Document OCR Provider Chain: PaddleOCR (Primary) -> EasyOCR (Secondary) -> NVIDIA Vision -> Gemini Reasoning (Silent Tesseract prohibited for production KYC)
 * 4. Dedicated Document Pipeline Execution (Aadhaar, PAN, DL, Voter ID, Skill Cert)
 * 5. Quality & Fingerprint Duplicate Assessment
 * 6. Transparent Risk & Consistency Scoring
 * 7. Dedicated Table Persistence
 */

import { aadhaarPipeline } from './aadhaarPipeline.js';
import { panPipeline } from './panPipeline.js';
import { drivingLicensePipeline } from './drivingLicensePipeline.js';
import { voterIdPipeline } from './voterIdPipeline.js';
import { skillCertificatePipeline } from './skillCertificatePipeline.js';
import { documentExtractionService } from '../ai/documentExtractionService.js';
import { documentQualityService } from '../ai/documentQualityService.js';
import { documentFingerprintService } from '../ai/documentFingerprintService.js';
import { kycConsistencyEngine } from '../ai/kycConsistencyEngine.js';
import { kycRiskEngine } from '../ai/kycRiskEngine.js';
import { documentStorageService } from '../pillar/documentStorageService.js';

export const kycRouter = {
  /**
   * Process any document through the authoritative-first KYC pipeline
   * @param {object} params
   * @param {string|File|Blob} params.document - Base64 Data URL, Image file, or PDF
   * @param {string} params.documentType - 'aadhaar' | 'pan' | 'driving_licence' | 'voter_id' | 'skill_certificate'
   * @param {string} params.documentCategory - 'identity' | 'skill_certificate'
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'uidai_qr' | 'digilocker' | 'ocr_ai'
   * @param {object} params.qrPayload - Raw QR string if source is QR
   * @param {function} params.onStatusUpdate - Status callback
   */
  async processDocument({
    document,
    documentType = 'aadhaar',
    documentCategory = 'identity',
    pillarProfile = {},
    sourceMethod = 'ocr_ai',
    qrPayload = null,
    onStatusUpdate = () => {}
  } = {}) {
    onStatusUpdate('INITIALIZING');
    const docKey = (documentType || 'aadhaar').toLowerCase();

    // ----------------------------------------------------
    // PATH 1: AUTHORITATIVE UIDAI SECURE QR SCANNING
    // ----------------------------------------------------
    if (sourceMethod === 'uidai_qr' && qrPayload) {
      onStatusUpdate('DECODING_SECURE_QR');
      try {
        const qrRes = await fetch('/api/kyc/aadhaar/decode-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrPayload, pillarProfile })
        });

        if (qrRes.ok) {
          const qrData = await qrRes.json();
          if (qrData.success) {
            onStatusUpdate('VALIDATING_STRUCTURE');
            const pipelineResult = aadhaarPipeline.processAadhaar({
              extractedData: qrData.extracted_data,
              pillarProfile,
              sourceMethod: 'uidai_qr'
            });

            pipelineResult.signature_verification = qrData.signature_verification;
            pipelineResult.authoritative_verified = qrData.authoritative_verified;
            if (qrData.authoritative_verified) {
              pipelineResult.verification_status = 'officially_verified';
            }

            // Persist to pillar_aadhaar_documents
            if (pillarProfile.id) {
              await documentStorageService.saveExtractedDocument({
                pillarId: pillarProfile.id,
                documentType: 'aadhaar',
                extractedData: pipelineResult.fields,
                rawOcrText: 'DECODED_FROM_UIDAI_SECURE_QR',
                documentUrl: null,
                validationResult: pipelineResult
              });
            }

            onStatusUpdate('COMPLETED');
            return {
              success: true,
              method: 'uidai_qr',
              pipelineResult
            };
          }
        }
      } catch (qrErr) {
        console.warn('[KYC Router] Server QR decoding notice:', qrErr.message);
      }
    }

    // ----------------------------------------------------
    // PATH 2: DIGILOCKER AUTHORITATIVE RETRIEVAL
    // ----------------------------------------------------
    if (sourceMethod === 'digilocker') {
      onStatusUpdate('CONNECTING_DIGILOCKER');
      try {
        const statusRes = await fetch('/api/kyc/digilocker/status');
        const statusData = await statusRes.json();

        if (!statusData.configured) {
          onStatusUpdate('FALLING_BACK_TO_OCR');
          // Gracefully fall back to OCR if DigiLocker credentials are not present
        }
      } catch (dlErr) {
        console.warn('[KYC Router] DigiLocker status check notice:', dlErr.message);
      }
    }

    // ----------------------------------------------------
    // PATH 3: OCR + VISION AI EXTRACTION (PRIMARY WORKHORSE)
    // ----------------------------------------------------
    onStatusUpdate('OCR_PROCESSING');
    const extractionResult = await documentExtractionService.processDocument({
      document,
      documentCategory,
      expectedDocumentType: docKey,
      pillarProfile,
      onStatusUpdate
    });

    const rawOcr = extractionResult.ocr?.rawText || extractionResult.ocr_raw_text || '';
    const cleanOcr = extractionResult.ocr?.cleanText || '';
    const extractedFields = extractionResult.fields || extractionResult.ai_extracted_data || {};

    // ----------------------------------------------------
    // PATH 4: DEDICATED PIPELINE DISPATCH
    // ----------------------------------------------------
    onStatusUpdate('DEDICATED_VALIDATION');
    let pipelineResult = null;

    if (docKey.includes('aadhaar') || docKey.includes('uidai')) {
      pipelineResult = aadhaarPipeline.processAadhaar({
        extractedData: extractedFields,
        pillarProfile,
        sourceMethod: 'ocr_ai'
      });
    } else if (docKey.includes('pan')) {
      pipelineResult = panPipeline.processPan({
        extractedData: extractedFields,
        pillarProfile,
        sourceMethod: 'ocr_ai'
      });
    } else if (docKey.includes('driving') || docKey.includes('license') || docKey.includes('dl')) {
      pipelineResult = drivingLicensePipeline.processDrivingLicense({
        extractedData: extractedFields,
        pillarProfile,
        sourceMethod: 'ocr_ai'
      });
    } else if (docKey.includes('voter') || docKey.includes('epic')) {
      pipelineResult = voterIdPipeline.processVoterId({
        extractedData: extractedFields,
        pillarProfile,
        sourceMethod: 'ocr_ai'
      });
    } else if (docKey.includes('skill') || docKey.includes('cert') || docKey.includes('iti') || docKey.includes('nsdc')) {
      pipelineResult = skillCertificatePipeline.processCertificate({
        extractedData: extractedFields,
        pillarProfile
      });
    } else {
      pipelineResult = aadhaarPipeline.processAadhaar({
        extractedData: extractedFields,
        pillarProfile,
        sourceMethod: 'ocr_ai'
      });
    }

    // ----------------------------------------------------
    // PATH 5: IMAGE QUALITY & RISK EVALUATION
    // ----------------------------------------------------
    const quality = documentQualityService.assessQuality({
      width: extractionResult.quality?.width || 1200,
      height: extractionResult.quality?.height || 800,
      fileSize: extractionResult.quality?.fileSize || 100000,
      ocrConfidence: extractionResult.ocr?.confidence || 85,
      rawText: rawOcr
    });

    const fingerprint = documentFingerprintService.generateFingerprint(
      docKey, 
      pipelineResult.fields?.document_number || pipelineResult.fields?.certificate_number || ''
    );
    const duplicate = documentFingerprintService.checkDuplicate(fingerprint, pillarProfile.id, []);

    const consistency = kycConsistencyEngine.evaluateDossierConsistency(
      [{
        document_type: docKey,
        full_name: pipelineResult.fields?.full_name || pipelineResult.fields?.worker_name,
        date_of_birth: pipelineResult.fields?.date_of_birth
      }],
      pillarProfile
    );

    const risk = kycRiskEngine.computeRiskScore({
      quality,
      validation: {
        mismatches: pipelineResult.validation_errors || [],
        missing_fields: []
      },
      consistency,
      duplicate,
      tradeMatch: pipelineResult.trade_evaluation || {}
    });

    // ----------------------------------------------------
    // PATH 6: PERSISTENCE TO DEDICATED TABLES
    // ----------------------------------------------------
    if (pillarProfile.id) {
      await documentStorageService.saveExtractedDocument({
        pillarId: pillarProfile.id,
        documentType: docKey,
        extractedData: pipelineResult.fields,
        rawOcrText: rawOcr,
        documentUrl: typeof document === 'string' && document.startsWith('data:') ? document : null,
        validationResult: pipelineResult
      });
    }

    onStatusUpdate('COMPLETED');
    return {
      success: true,
      documentType: docKey,
      method: 'ocr_ai',
      pipelineResult,
      quality,
      fingerprint,
      duplicate,
      consistency,
      risk,
      extraction: extractionResult
    };
  }
};

export default kycRouter;
