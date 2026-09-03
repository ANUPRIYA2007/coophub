/**
 * COOP HUB — Rules-Based Welfare Eligibility Engine
 * 
 * Deterministic, explainable evaluation of Pillar eligibility for statutory & cooperative welfare schemes.
 * Zero fake AI. Truthful labeling of external schemes.
 */

export const welfareEligibilityEngine = {
  /**
   * Evaluate Pillar profile against a specific welfare scheme
   * 
   * @param {Object} pillarProfile - Pillar profile with age/dob, services, bank info, kyc status
   * @param {Object} scheme - Scheme object with code, eligibility criteria, and requirements
   * @returns {Object} Evaluation decision object
   */
  evaluateScheme(pillarProfile, scheme) {
    if (!scheme) {
      return { status: 'INFORMATION_REQUIRED', reasons: ['Scheme definition missing.'] };
    }

    const schemeCode = scheme.scheme_code || scheme.id || '';
    const now = new Date();

    // 1. Calculate Age
    let age = pillarProfile?.age;
    if (!age && pillarProfile?.dob) {
      const birthDate = new Date(pillarProfile.dob);
      if (!isNaN(birthDate.getTime())) {
        age = Math.floor((now - birthDate) / (365.25 * 24 * 3600 * 1000));
      }
    }

    const hasBank = Boolean(pillarProfile?.bank_account_number && pillarProfile?.bank_ifsc);
    const hasAadhaar = Boolean(pillarProfile?.is_aadhaar_verified || pillarProfile?.aadhaar_number);
    const hasLabourCard = Boolean(pillarProfile?.labour_card_uploaded || pillarProfile?.is_labour_card_verified);
    const tradeServices = pillarProfile?.main_services || [];
    const isUnorganisedTrade = tradeServices.length > 0; // Tradesmen registered in COOP HUB

    const missingRequirements = [];
    const reasons = [];

    // Scheme 1: Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)
    if (schemeCode.includes('PMJJBY')) {
      if (age === undefined || age === null) {
        missingRequirements.push('Date of Birth / Age verification');
      }
      if (!hasBank) {
        missingRequirements.push('Registered Savings Bank Account details');
      }
      if (missingRequirements.length > 0) {
        return {
          schemeCode,
          status: 'INFORMATION_REQUIRED',
          reasons: ['Additional verified profile information is needed to confirm eligibility.'],
          missingRequirements,
          requiredDocuments: ['Aadhaar Card', 'Bank Passbook / Cancelled Cheque'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      if (age < 18 || age > 50) {
        return {
          schemeCode,
          status: 'NOT_ELIGIBLE',
          reasons: [`Age (${age} years) is outside the permissible window of 18 to 50 years.`],
          missingRequirements: [],
          requiredDocuments: ['Aadhaar Card', 'Bank Passbook'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      return {
        schemeCode,
        status: 'ELIGIBLE',
        reasons: [`Pillar is ${age} years old (within 18–50) with verified savings bank KYC.`],
        missingRequirements: [],
        requiredDocuments: ['Aadhaar Card', 'Bank Passbook'],
        evaluatedAt: now.toISOString(),
        isOfficialIntegrated: false
      };
    }

    // Scheme 2: Pradhan Mantri Suraksha Bima Yojana (PMSBY)
    if (schemeCode.includes('PMSBY')) {
      if (age === undefined || age === null) {
        missingRequirements.push('Date of Birth / Age verification');
      }
      if (!hasBank) {
        missingRequirements.push('Active Savings Bank Account with auto-debit consent');
      }
      if (missingRequirements.length > 0) {
        return {
          schemeCode,
          status: 'INFORMATION_REQUIRED',
          reasons: ['Bank account and age details required.'],
          missingRequirements,
          requiredDocuments: ['Aadhaar Card', 'Bank Account Proof'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      if (age < 18 || age > 70) {
        return {
          schemeCode,
          status: 'NOT_ELIGIBLE',
          reasons: [`Age (${age} years) is outside the permissible window of 18 to 70 years.`],
          missingRequirements: [],
          requiredDocuments: ['Aadhaar Card', 'Bank Account Proof'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      return {
        schemeCode,
        status: 'ELIGIBLE',
        reasons: [`Pillar is ${age} years old (within 18–70) with linked bank account.`],
        missingRequirements: [],
        requiredDocuments: ['Aadhaar Card', 'Bank Account Proof'],
        evaluatedAt: now.toISOString(),
        isOfficialIntegrated: false
      };
    }

    // Scheme 3: Tamil Nadu Unorganised Workers Welfare Board (TNUWWB)
    if (schemeCode.includes('UWWB') || schemeCode.includes('TN')) {
      if (age === undefined || age === null) {
        missingRequirements.push('Date of Birth / Age verification');
      }
      if (!isUnorganisedTrade) {
        missingRequirements.push('Declared trade specialization in qualifying craft (Electrical, Plumbing, Carpentry, etc.)');
      }
      if (missingRequirements.length > 0) {
        return {
          schemeCode,
          status: 'INFORMATION_REQUIRED',
          reasons: ['Trade craft and identity proof required for TNUWWB evaluation.'],
          missingRequirements,
          requiredDocuments: ['Aadhaar Card', 'TNUWWB Labour Card / Trade Experience Certificate'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      if (age < 18 || age > 60) {
        return {
          schemeCode,
          status: 'NOT_ELIGIBLE',
          reasons: [`Age (${age} years) exceeds the maximum statutory eligibility age of 60 years.`],
          missingRequirements: [],
          requiredDocuments: ['Aadhaar Card', 'Labour Card'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      return {
        schemeCode,
        status: 'ELIGIBLE',
        reasons: [`Registered unorganised tradesman in Tamil Nadu within qualifying age (18–60).`],
        missingRequirements: hasLabourCard ? [] : ['Physical TNUWWB Welfare Board Card registration'],
        requiredDocuments: ['Aadhaar Card', 'Smart Card / Ration Card', 'Bank Passbook'],
        evaluatedAt: now.toISOString(),
        isOfficialIntegrated: false
      };
    }

    // Scheme 4: Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)
    if (schemeCode.includes('PMSYM') || schemeCode.includes('SYM')) {
      if (age === undefined || age === null) {
        missingRequirements.push('Date of Birth / Age verification');
      }
      if (missingRequirements.length > 0) {
        return {
          schemeCode,
          status: 'INFORMATION_REQUIRED',
          reasons: ['Age verification needed.'],
          missingRequirements,
          requiredDocuments: ['Aadhaar Card', 'Jan Dhan / Savings Bank Account'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      if (age < 18 || age > 40) {
        return {
          schemeCode,
          status: 'NOT_ELIGIBLE',
          reasons: [`Age (${age} years) is outside entry window of 18 to 40 years.`],
          missingRequirements: [],
          requiredDocuments: ['Aadhaar Card', 'Bank Account with IFSC'],
          evaluatedAt: now.toISOString(),
          isOfficialIntegrated: false
        };
      }

      return {
        schemeCode,
        status: 'ELIGIBLE',
        reasons: [`Eligible for voluntary monthly contributory pension (entry age ${age} within 18–40).`],
        missingRequirements: [],
        requiredDocuments: ['Aadhaar Card', 'Bank Account with IFSC'],
        evaluatedAt: now.toISOString(),
        isOfficialIntegrated: false
      };
    }

    // Default Fallback
    return {
      schemeCode,
      status: 'INFORMATION_REQUIRED',
      reasons: ['Manual review required to verify scheme-specific eligibility parameters.'],
      missingRequirements: ['Identity & Residency Verification'],
      requiredDocuments: ['Aadhaar Card', 'Bank Account Proof'],
      evaluatedAt: now.toISOString(),
      isOfficialIntegrated: false
    };
  },

  /**
   * Evaluate a Pillar against all schemes in the directory
   */
  evaluateAllSchemes(pillarProfile, schemes = []) {
    return (schemes || []).map(scheme => {
      const evaluation = this.evaluateScheme(pillarProfile, scheme);
      return {
        ...scheme,
        evaluation
      };
    });
  }
};

export default welfareEligibilityEngine;
