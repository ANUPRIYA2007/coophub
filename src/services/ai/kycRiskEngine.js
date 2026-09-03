/**
 * COOP HUB — Transparent KYC Risk Scoring & Decision Engine
 * 
 * Computes an explainable, deterministic KYC risk score (0 to 100)
 * with explicit penalty factors.
 * 
 * CORE PRINCIPLES:
 * 1. ZERO arbitrary unexplained numbers: every point corresponds to a documented risk factor.
 * 2. Risk score DOES NOT equal government verification.
 * 3. Never automatically grant "VERIFIED" based solely on risk/OCR.
 * 
 * Risk Tiers:
 * - LOW RISK: score < 25 (Proceed to Admin Review)
 * - MEDIUM RISK: score 25-55 (Manual Document Inspection Recommended)
 * - HIGH RISK: score > 55 (Manual Verification Required / Conflicting Data)
 */

export const kycRiskEngine = {
  /**
   * Evaluate full KYC dossier risk
   * @param {object} params
   * @param {object} params.quality - Output from documentQualityService
   * @param {object} params.validation - Output from documentValidationService
   * @param {object} params.consistency - Output from kycConsistencyEngine
   * @param {object} params.duplicate - Output from documentFingerprintService
   * @param {object} params.tradeMatch - Output from compareTradeWithCertificate
   */
  computeRiskScore({
    quality = {},
    validation = {},
    consistency = {},
    duplicate = {},
    tradeMatch = {}
  } = {}) {
    let score = 0;
    const riskFlags = [];
    const positiveSignals = [];

    // Factor 1: Document Image Quality
    if (quality.quality_tier === 'UNREADABLE') {
      score += 40;
      riskFlags.push({
        factor: 'DOCUMENT_UNREADABLE',
        penalty: 40,
        severity: 'HIGH',
        explanation: 'Document image is unreadable or corrupted. Clear visual re-upload required.'
      });
    } else if (quality.quality_tier === 'POOR') {
      score += 20;
      riskFlags.push({
        factor: 'DOCUMENT_POOR_QUALITY',
        penalty: 20,
        severity: 'MEDIUM',
        explanation: 'Document resolution or contrast is low, increasing risk of OCR misreads.'
      });
    } else if (quality.quality_tier === 'GOOD') {
      positiveSignals.push('High-clarity document image with strong OCR character density.');
    }

    // Factor 2: Identifier Format Validity
    if (validation.mismatches && validation.mismatches.some(m => m.severity === 'HIGH')) {
      score += 25;
      riskFlags.push({
        factor: 'INVALID_IDENTIFIER_FORMAT',
        penalty: 25,
        severity: 'HIGH',
        explanation: 'Document identifier does not conform to official government formatting rules.'
      });
    } else if (validation.missing_fields && validation.missing_fields.length > 0) {
      const pen = Math.min(20, validation.missing_fields.length * 10);
      score += pen;
      riskFlags.push({
        factor: 'MISSING_MANDATORY_FIELDS',
        penalty: pen,
        severity: 'MEDIUM',
        explanation: `Mandatory fields missing: ${validation.missing_fields.join(', ')}.`
      });
    } else {
      positiveSignals.push('Document identifier conforms strictly to official format specifications.');
    }

    // Factor 3: Cross-Document Name Consistency
    if (consistency.name_consistency === 'MISMATCH') {
      score += 30;
      riskFlags.push({
        factor: 'NAME_MISMATCH',
        penalty: 30,
        severity: 'HIGH',
        explanation: 'Applicant name on identity document conflicts with registered profile name.'
      });
    } else if (consistency.name_consistency === 'MINOR_VARIATION') {
      score += 10;
      riskFlags.push({
        factor: 'NAME_MINOR_VARIATION',
        penalty: 10,
        severity: 'LOW',
        explanation: 'Minor name variation detected (e.g. abbreviation, middle initial, or spacing).'
      });
    } else if (consistency.name_consistency === 'MATCH' || consistency.name_consistency === 'CONSISTENT') {
      positiveSignals.push('Applicant name perfectly matches across registered profile and document.');
    }

    // Factor 4: Date of Birth Consistency
    if (consistency.dob_consistency === 'MISMATCH') {
      score += 25;
      riskFlags.push({
        factor: 'DOB_MISMATCH',
        penalty: 25,
        severity: 'HIGH',
        explanation: 'Date of birth on document conflicts with applicant profile.'
      });
    } else if (consistency.dob_consistency === 'MATCH') {
      positiveSignals.push('Date of birth matches registered profile.');
    }

    // Factor 5: Skill Certificate Trade Alignment
    if (tradeMatch.status === 'TRADE_MISMATCH') {
      score += 20;
      riskFlags.push({
        factor: 'TRADE_MISMATCH',
        penalty: 20,
        severity: 'MEDIUM',
        explanation: `Skill certificate trade (${tradeMatch.certificate_trade}) does not match declared trade (${tradeMatch.declared_trade}).`
      });
    } else if (tradeMatch.status === 'TRADE_MATCH') {
      positiveSignals.push('Skill certificate trade aligns with declared cooperative specialization.');
    }

    // Factor 6: Duplicate Document Collision
    if (duplicate.is_duplicate) {
      score += 50;
      riskFlags.push({
        factor: 'DUPLICATE_DOCUMENT_COLLISION',
        penalty: 50,
        severity: 'CRITICAL',
        explanation: 'Cryptographic document fingerprint matches another registered Pillar account.'
      });
    } else if (duplicate.status === 'NO_DUPLICATE') {
      positiveSignals.push('Document identifier is unique across the cooperative registry.');
    }

    // Bound total score between 0 and 100
    const finalScore = Math.min(100, Math.max(0, score));

    // Risk Classification Tier
    let riskTier = 'LOW_RISK';
    let recommendation = 'PROCEED_TO_ADMIN_REVIEW';
    let recommendationText = 'Document meets consistency and quality thresholds. Ready for administrative approval.';

    if (finalScore >= 55 || duplicate.is_duplicate || consistency.name_consistency === 'MISMATCH') {
      riskTier = 'HIGH_RISK';
      recommendation = 'MANUAL_VERIFICATION_REQUIRED';
      recommendationText = 'Significant discrepancies or duplicate detected. Authoritative document verification required.';
    } else if (finalScore >= 25 || quality.quality_tier === 'POOR' || consistency.name_consistency === 'MINOR_VARIATION') {
      riskTier = 'MEDIUM_RISK';
      recommendation = 'MANUAL_INSPECTION_RECOMMENDED';
      recommendationText = 'Minor discrepancies or quality warnings detected. Visual inspection by Administrator recommended.';
    }

    if (quality.quality_tier === 'UNREADABLE') {
      recommendation = 'REQUEST_RE_UPLOAD';
      recommendationText = 'Document is unreadable. Request applicant to re-upload clear photo or scan.';
    }

    return {
      risk_score: finalScore,
      risk_tier: riskTier,
      recommendation,
      recommendation_text: recommendationText,
      risk_flags: riskFlags,
      positive_signals: positiveSignals,
      evaluated_at: new Date().toISOString()
    };
  }
};

export default kycRiskEngine;
