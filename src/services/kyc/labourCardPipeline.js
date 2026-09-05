/**
 * COOP HUB — Dedicated Labour / Construction Welfare Board Card Pipeline
 * 
 * Complies with State Unorganised & Construction Workers Welfare Boards (e.g. TNCWWB / TNUWWB):
 * - Extracts: Registration Number, Worker Name, Registered Trade/Occupation, Welfare Board, District, Issue Date
 * - Profile Matching: Worker Name & Registered Trade Alignment (using trade synonyms)
 * - Zero hardcoded identity fallbacks
 */

const TRADE_SYNONYMS = {
  electrician: ['electrical', 'wireman', 'electrician', 'lineman', 'iti electrical', 'domestic electrician', 'power'],
  plumber: ['plumbing', 'pipe fitter', 'plumber', 'sanitary', 'drainage', 'water supply'],
  carpenter: ['carpentry', 'woodwork', 'carpenter', 'furniture maker', 'joinery'],
  painter: ['painting', 'painter', 'coating', 'decorator', 'surface finish'],
  mason: ['masonry', 'civil', 'bricklayer', 'concrete', 'building construction', 'construction worker', 'general construction'],
  'ac technician': ['hvac', 'refrigeration', 'air conditioning', 'ac repair', 'cooling', 'rac', 'ac mechanic'],
  mechanic: ['mechanic', 'fitter', 'motor mechanic', 'machinist', 'automobile']
};

export function maskLabourCardNumber(regStr = '') {
  if (!regStr) return null;
  const clean = regStr.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 6) return clean;
  return `${clean.slice(0, 3)}-XXXX-${clean.slice(-3)}`;
}

export const labourCardPipeline = {
  /**
   * Evaluate if labour board registered occupation aligns with technician trade
   */
  evaluateTradeAlignment(declaredTrade = '', boardTrade = '') {
    const decl = (declaredTrade || '').toLowerCase().trim();
    const board = (boardTrade || '').toLowerCase().trim();

    if (!decl || !board) {
      return {
        matched: false,
        status: 'INSUFFICIENT_DATA',
        explanation: 'Either registered trade or labour board occupation could not be identified.'
      };
    }

    if (decl.includes(board) || board.includes(decl)) {
      return {
        matched: true,
        status: 'TRADE_MATCH',
        declared_trade: declaredTrade,
        board_trade: boardTrade,
        explanation: `Labour welfare board occupation (${boardTrade}) matches declared technician trade (${declaredTrade}).`
      };
    }

    for (const [key, synonyms] of Object.entries(TRADE_SYNONYMS)) {
      const declMatches = decl.includes(key) || synonyms.some(s => decl.includes(s));
      const boardMatches = board.includes(key) || synonyms.some(s => board.includes(s));
      if (declMatches && boardMatches) {
        return {
          matched: true,
          status: 'TRADE_MATCH',
          declared_trade: declaredTrade,
          board_trade: boardTrade,
          explanation: `Labour welfare board trade (${boardTrade}) aligns with (${declaredTrade}) via vocational domain synonym (${key}).`
        };
      }
    }

    return {
      matched: false,
      status: 'TRADE_MISMATCH',
      declared_trade: declaredTrade,
      board_trade: boardTrade,
      explanation: `Notice: Labour board occupation (${boardTrade}) does not directly match declared trade (${declaredTrade}). Human inspection recommended.`
    };
  },

  /**
   * Process and validate a Labour Welfare Board Card extraction
   * @param {object} params
   * @param {object} params.extractedData - Extracted fields from OCR / Vision
   * @param {object} params.pillarProfile - Registered technician profile
   * @param {string} params.sourceMethod - 'government_api' | 'ocr_ai'
   */
  processLabourCard({ extractedData = {}, pillarProfile = {}, sourceMethod = 'ocr_ai' } = {}) {
    const rawNumber = (extractedData.document_number || extractedData.registration_number || '').trim();
    const cleanNumber = rawNumber.replace(/\s+/g, '');
    const extractedName = (extractedData.full_name || extractedData.worker_name || extractedData.name || '').trim();
    const trade = extractedData.trade || extractedData.occupation || extractedData.skill || null;
    const district = extractedData.district || null;
    const welfareBoard = extractedData.welfare_board || extractedData.issuing_authority || 'Construction Workers Welfare Board';
    const issueDate = extractedData.issue_date || null;

    const validationErrors = [];
    const warnings = [];

    // 1. Format check: Alphanumeric registration string, minimum 5 chars
    let isFormatValid = false;
    if (!cleanNumber) {
      validationErrors.push({
        field: 'registration_number',
        severity: 'HIGH',
        message: 'Labour Welfare Board registration number was not detected on card scan.'
      });
    } else if (cleanNumber.length >= 5) {
      isFormatValid = true;
    } else {
      validationErrors.push({
        field: 'registration_number',
        severity: 'HIGH',
        message: `Extracted registration number (${rawNumber}) is too short to be a valid welfare board ID.`
      });
    }

    // 2. Name validation against profile
    const registeredName = (pillarProfile.full_name || pillarProfile.fullName || '').toLowerCase().trim();
    const cleanExtractedName = extractedName.toLowerCase().trim();
    let nameScore = 0;

    if (!extractedName) {
      validationErrors.push({
        field: 'full_name',
        severity: 'HIGH',
        message: 'Worker name could not be extracted from Labour Welfare Card.'
      });
    } else if (registeredName) {
      if (cleanExtractedName === registeredName) {
        nameScore = 1.0;
      } else if (cleanExtractedName.includes(registeredName) || registeredName.includes(cleanExtractedName)) {
        nameScore = 0.90;
      } else {
        const regTokens = registeredName.split(/\s+/).filter(t => t.length > 2);
        const extTokens = cleanExtractedName.split(/\s+/).filter(t => t.length > 2);
        const overlap = regTokens.filter(t => extTokens.some(et => et.includes(t) || t.includes(et)));
        nameScore = regTokens.length > 0 ? overlap.length / regTokens.length : 0;
      }

      if (nameScore < 0.5) {
        validationErrors.push({
          field: 'full_name',
          severity: 'HIGH',
          submitted: registeredName,
          extracted: extractedName,
          message: `Labour card name "${extractedName}" does not align with registered applicant name "${registeredName}".`
        });
      } else if (nameScore < 0.85) {
        warnings.push(`Minor spelling variation on labour card: "${extractedName}" vs "${registeredName}".`);
      }
    }

    // 3. Trade Alignment
    const declaredTrade = Array.isArray(pillarProfile.main_services) 
      ? pillarProfile.main_services[0] 
      : (pillarProfile.main_services || '');
    const tradeEvaluation = this.evaluateTradeAlignment(declaredTrade, trade);
    if (!tradeEvaluation.matched && trade) {
      warnings.push(tradeEvaluation.explanation);
    }

    const hasHighSeverityError = validationErrors.some(e => e.severity === 'HIGH');
    const verificationStatus = hasHighSeverityError 
      ? 'manual_review' 
      : (validationErrors.length === 0 ? 'ai_assisted' : 'manual_review');

    return {
      document_type: 'labour_card',
      format_valid: isFormatValid,
      format_status: isFormatValid ? 'FORMAT_VALID' : 'FORMAT_INVALID',
      verification_status: verificationStatus,
      authoritative_verified: sourceMethod === 'government_api',
      source_method: sourceMethod,
      name_match_score: nameScore,
      trade_evaluation: tradeEvaluation,
      validation_errors: validationErrors,
      warnings,
      fields: {
        document_number: cleanNumber || null,
        document_number_masked: maskLabourCardNumber(cleanNumber),
        full_name: extractedName || null,
        trade,
        district,
        welfare_board: welfareBoard,
        issue_date: issueDate,
        date_of_birth: null,
        address: null,
        gender: null
      },
      processed_at: new Date().toISOString()
    };
  }
};

export default labourCardPipeline;
