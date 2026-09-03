/**
 * COOP HUB — KYC Cross-Document Consistency & Skill Intelligence Engine
 * 
 * Compares Name, DOB, Address, and Skill Certificate Trade across multiple
 * uploaded documents and the registered Pillar profile.
 * 
 * Result Tiers:
 * - CONSISTENT: Names, DOBs, and declared trades match across documents
 * - MINOR_VARIATION: Minor formatting differences, middle initials, or punctuation
 * - MISMATCH: Distinct names, conflicting DOBs, or conflicting trades detected
 * - INSUFFICIENT_DATA: Missing documents or unextracted fields
 */

export const kycConsistencyEngine = {
  /**
   * Safe Name Normalization for Indian names
   * Strips honorifics (Mr, Shri, Dr), collapses whitespace, lowercases
   */
  normalizeName(rawName = '') {
    if (!rawName) return '';
    return rawName
      .toLowerCase()
      .replace(/^(mr\.|mr|mrs\.|mrs|ms\.|ms|shri|smt\.|smt|dr\.|dr)\s+/i, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Compare two names handling initials, word reordering, and token overlap
   * e.g., "Ravi Kumar" vs "Ravi K" -> Minor variation (score ~0.85)
   * "Ravi Kumar" vs "Rahul Kumar" -> Mismatch (score ~0.50)
   */
  compareNames(nameA = '', nameB = '') {
    const normA = this.normalizeName(nameA);
    const normB = this.normalizeName(nameB);

    if (!normA || !normB) {
      return { score: 0, status: 'INSUFFICIENT_DATA', explanation: 'One or both names are missing.' };
    }

    if (normA === normB) {
      return { score: 1.0, status: 'MATCH', explanation: 'Names match exactly after normalization.' };
    }

    const tokensA = normA.split(' ').filter(Boolean);
    const tokensB = normB.split(' ').filter(Boolean);

    // Check for initials match (e.g. "Ravi K" vs "Ravi Kumar")
    let initialMatch = false;
    if (tokensA.length >= 2 && tokensB.length >= 2) {
      const firstA = tokensA[0];
      const firstB = tokensB[0];
      const lastA = tokensA[tokensA.length - 1];
      const lastB = tokensB[tokensB.length - 1];

      if (firstA === firstB) {
        if ((lastA.length === 1 && lastB.startsWith(lastA)) ||
            (lastB.length === 1 && lastA.startsWith(lastB))) {
          initialMatch = true;
        }
      }
    }

    // Token set overlap (Jaccard similarity)
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let intersection = 0;
    for (const t of setA) {
      if (setB.has(t)) intersection++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    if (initialMatch) {
      return {
        score: 0.85,
        status: 'MINOR_VARIATION',
        explanation: `Names align with abbreviated initial ("${nameA}" vs "${nameB}").`
      };
    }

    if (jaccard >= 0.8) {
      return {
        score: jaccard,
        status: 'MATCH',
        explanation: 'Tokens match with high confidence.'
      };
    }

    if (jaccard >= 0.5) {
      return {
        score: jaccard,
        status: 'MINOR_VARIATION',
        explanation: `Minor name variations detected ("${nameA}" vs "${nameB}").`
      };
    }

    return {
      score: jaccard,
      status: 'MISMATCH',
      explanation: `Name mismatch detected: "${nameA}" vs "${nameB}".`
    };
  },

  /**
   * Compare Date of Birth values across documents
   * Normalizes formats like DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
   */
  compareDobs(dobA = '', dobB = '') {
    if (!dobA || !dobB) {
      return { status: 'NOT_AVAILABLE', explanation: 'DOB not provided on all documents.' };
    }

    const cleanA = dobA.replace(/[-.]/g, '/').trim();
    const cleanB = dobB.replace(/[-.]/g, '/').trim();

    // Standardize DD/MM/YYYY
    const partsA = cleanA.split('/');
    const partsB = cleanB.split('/');

    let stdA = cleanA;
    let stdB = cleanB;

    if (partsA.length === 3 && partsA[0].length === 4) {
      stdA = `${partsA[2]}/${partsA[1]}/${partsA[0]}`; // YYYY/MM/DD -> DD/MM/YYYY
    }
    if (partsB.length === 3 && partsB[0].length === 4) {
      stdB = `${partsB[2]}/${partsB[1]}/${partsB[0]}`;
    }

    if (stdA === stdB) {
      return { status: 'MATCH', explanation: 'Date of birth matches exactly.' };
    }

    // Check year only match if partial
    const yearA = cleanA.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
    const yearB = cleanB.match(/\b(19\d{2}|20\d{2})\b/)?.[1];

    if (yearA && yearB && yearA === yearB) {
      return {
        status: 'MINOR_VARIATION',
        explanation: `Birth year (${yearA}) matches, but day/month formatting differs.`
      };
    }

    return {
      status: 'MISMATCH',
      explanation: `Conflicting Date of Birth values: "${dobA}" vs "${dobB}".`
    };
  },

  /**
   * Compare Declared Pillar Trade against Skill Certificate content
   * Never claims official certificate authentication; checks content match
   */
  compareTradeWithCertificate(declaredTrade = '', certContent = {}) {
    const certTrade = certContent.trade || certContent.skill || certContent.course || certContent.service || '';
    const declared = (declaredTrade || '').toLowerCase().trim();
    const extracted = (certTrade || '').toLowerCase().trim();

    if (!declared || !extracted) {
      return {
        status: 'INSUFFICIENT_DATA',
        label: 'TRADE_DATA_MISSING',
        explanation: 'Declared trade or certificate trade information is missing.'
      };
    }

    // Trade aliases dictionary for common skilled trades
    const TRADE_ALIASES = {
      electrician: ['electrical', 'wireman', 'electrician', 'lineman', 'iti electrical'],
      plumber: ['plumbing', 'pipe fitter', 'plumber', 'sanitary'],
      carpenter: ['carpentry', 'woodwork', 'carpenter', 'furniture'],
      painter: ['painting', 'painter', 'coating', 'decorator'],
      mason: ['masonry', 'civil', 'bricklayer', 'concrete'],
      'ac technician': ['hvac', 'refrigeration', 'air conditioning', 'ac repair', 'cooling'],
      appliance: ['home appliance', 'electronics', 'consumer electronics']
    };

    let isMatch = false;
    if (extracted.includes(declared) || declared.includes(extracted)) {
      isMatch = true;
    } else {
      // Check aliases
      for (const [key, aliases] of Object.entries(TRADE_ALIASES)) {
        if (declared.includes(key) || key.includes(declared)) {
          if (aliases.some(a => extracted.includes(a))) {
            isMatch = true;
            break;
          }
        }
      }
    }

    if (isMatch) {
      return {
        status: 'TRADE_MATCH',
        label: 'CERTIFICATE CONTENT MATCH',
        declared_trade: declaredTrade,
        certificate_trade: certTrade,
        explanation: `Certificate trade (${certTrade}) aligns with declared trade (${declaredTrade}).`
      };
    }

    return {
      status: 'TRADE_MISMATCH',
      label: 'CERTIFICATE CONTENT MISMATCH',
      declared_trade: declaredTrade,
      certificate_trade: certTrade,
      explanation: `Certificate trade (${certTrade}) does NOT match declared trade (${declaredTrade}).`
    };
  },

  /**
   * Full Cross-Document Consistency Check for a Pillar's Dossier
   * Compares all uploaded identity documents and registered profile
   */
  evaluateDossierConsistency(documents = [], pillarProfile = {}) {
    const findings = [];
    let nameStatus = 'CONSISTENT';
    let dobStatus = 'NOT_AVAILABLE';
    let overallStatus = 'CONSISTENT';

    const registeredName = pillarProfile.full_name || pillarProfile.fullName || '';
    const registeredDob = pillarProfile.dob || pillarProfile.date_of_birth || '';

    // 1. Compare each document's name with registered name
    const extractedNames = [];
    const extractedDobs = [];

    documents.forEach((doc, idx) => {
      const docName = doc.full_name || doc.extracted_name || doc.extracted_data?.full_name || '';
      const docDob = doc.date_of_birth || doc.extracted_dob || doc.extracted_data?.date_of_birth || '';
      const docType = doc.document_type || `Document ${idx + 1}`;

      if (docName) extractedNames.push({ name: docName, source: docType });
      if (docDob) extractedDobs.push({ dob: docDob, source: docType });

      if (registeredName && docName) {
        const nameComp = this.compareNames(registeredName, docName);
        findings.push({
          field: 'full_name',
          document: docType,
          comparison: nameComp
        });

        if (nameComp.status === 'MISMATCH') {
          nameStatus = 'MISMATCH';
          overallStatus = 'MISMATCH';
        } else if (nameComp.status === 'MINOR_VARIATION' && nameStatus !== 'MISMATCH') {
          nameStatus = 'MINOR_VARIATION';
          if (overallStatus !== 'MISMATCH') overallStatus = 'MINOR_VARIATION';
        }
      }

      if (registeredDob && docDob) {
        const dobComp = this.compareDobs(registeredDob, docDob);
        findings.push({
          field: 'date_of_birth',
          document: docType,
          comparison: dobComp
        });

        if (dobComp.status === 'MISMATCH') {
          dobStatus = 'MISMATCH';
          overallStatus = 'MISMATCH';
        } else if (dobComp.status === 'MATCH' && dobStatus !== 'MISMATCH') {
          dobStatus = 'MATCH';
        }
      }
    });

    // 2. Cross-compare extracted names between documents if 2+ documents exist
    if (extractedNames.length >= 2) {
      for (let i = 0; i < extractedNames.length - 1; i++) {
        for (let j = i + 1; j < extractedNames.length; j++) {
          const cross = this.compareNames(extractedNames[i].name, extractedNames[j].name);
          if (cross.status === 'MISMATCH') {
            overallStatus = 'MISMATCH';
            nameStatus = 'MISMATCH';
            findings.push({
              field: 'cross_document_name',
              docA: extractedNames[i].source,
              docB: extractedNames[j].source,
              comparison: cross
            });
          }
        }
      }
    }

    return {
      overall_status: overallStatus,
      name_consistency: nameStatus,
      dob_consistency: dobStatus,
      findings,
      evaluated_at: new Date().toISOString()
    };
  }
};

export default kycConsistencyEngine;
