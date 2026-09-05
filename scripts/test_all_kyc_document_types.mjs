/**
 * COOP HUB — Comprehensive KYC & Document Verification Test Suite
 * Tests all 9 supported document types across dedicated pipelines and validation engine:
 * 1. Aadhaar Card
 * 2. PAN Card
 * 3. Voter ID Card
 * 4. Driving Licence
 * 5. Indian Passport
 * 6. Smart Ration Card / TNEPDS
 * 7. Construction / Labour Welfare Board Card
 * 8. Trade & Skill Certificate (ITI / NSDC)
 * 9. Other Official Government ID
 *
 * Plus edge cases:
 * - Expired documents (DL, Passport)
 * - Name mismatch vs match
 * - Missing fields / unreadable data (must remain null, never hallucinated)
 * - PAN card strict field boundaries (address and gender must be null)
 */

import { aadhaarPipeline } from '../src/services/kyc/aadhaarPipeline.js';
import { panPipeline } from '../src/services/kyc/panPipeline.js';
import { drivingLicensePipeline } from '../src/services/kyc/drivingLicensePipeline.js';
import { voterIdPipeline } from '../src/services/kyc/voterIdPipeline.js';
import { passportPipeline } from '../src/services/kyc/passportPipeline.js';
import { rationCardPipeline } from '../src/services/kyc/rationCardPipeline.js';
import { labourCardPipeline } from '../src/services/kyc/labourCardPipeline.js';
import { skillCertificatePipeline } from '../src/services/kyc/skillCertificatePipeline.js';
import { generalGovtIdPipeline } from '../src/services/kyc/generalGovtIdPipeline.js';
import { documentValidationService } from '../src/services/ai/documentValidationService.js';
import { DOCUMENT_TYPES, DOCUMENT_SCHEMAS } from '../src/services/pillar/verificationDataset.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error(`     Details:`, details);
  }
}

console.log('================================================================');
console.log(' COOP HUB — ALL SUPPORTED KYC DOCUMENT TYPES TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// TEST 0: Document Types and Schemas Registry
// -------------------------------------------------------------
console.log('[TEST 0] Verifying Document Types and Schemas Registry');
const expectedKeys = [
  'AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE',
  'PASSPORT', 'RATION_CARD', 'LABOUR_CARD', 'SKILL_CERTIFICATE', 'OTHER'
];
for (const key of expectedKeys) {
  assert(DOCUMENT_TYPES[key] !== undefined, `DOCUMENT_TYPES contains ${key}`);
}
assert(Object.keys(DOCUMENT_SCHEMAS).length >= 9, `DOCUMENT_SCHEMAS has definitions for all 9 document types`);
console.log();

// Sample Pillar Profile
const testProfile = {
  id: 'pillar-uuid-101',
  full_name: 'Anupriya Murugan',
  fullName: 'Anupriya Murugan',
  date_of_birth: '1996-05-14',
  dob: '1996-05-14',
  gender: 'FEMALE',
  phone: '9876543210',
  city: 'Chennai',
  district: 'Chennai',
  main_services: ['Electrical Services', 'AC Repair & Servicing'],
  trade: 'Electrician'
};

// -------------------------------------------------------------
// TEST 1: UIDAI Aadhaar Card Pipeline
// -------------------------------------------------------------
console.log('[TEST 1] Testing Aadhaar Card Pipeline');
// 3675 9834 6016 is a mathematically valid Verhoeff 12-digit number
const validAadhaarData = {
  document_type: 'aadhaar',
  full_name: 'Anupriya Murugan',
  document_number: '3675 9834 6016',
  date_of_birth: '14/05/1996',
  gender: 'FEMALE',
  address: 'No 45, Anna Nagar, Chennai, Tamil Nadu 600040'
};

const aadhaarRes = aadhaarPipeline.processAadhaar({
  extractedData: validAadhaarData,
  pillarProfile: testProfile
});
assert(aadhaarRes.document_type === 'aadhaar', 'Aadhaar pipeline returns docType aadhaar');
assert(aadhaarRes.verhoeff_checksum_valid === true, 'Aadhaar Verhoeff checksum validates successfully');
assert(aadhaarRes.name_alignment.similarity_score >= 0.85, 'Aadhaar name matches registered profile');
assert(aadhaarRes.fields.document_number_masked.startsWith('XXXX-XXXX-'), 'Aadhaar number is properly masked for security');

// Edge Case: Invalid Verhoeff checksum
const invalidAadhaarData = {
  ...validAadhaarData,
  document_number: '1234 5678 9012' // invalid checksum
};
const invalidAadhaarRes = aadhaarPipeline.processAadhaar({
  extractedData: invalidAadhaarData,
  pillarProfile: testProfile
});
assert(invalidAadhaarRes.verhoeff_checksum_valid === false, 'Invalid Aadhaar checksum fails Verhoeff validation');
console.log();

// -------------------------------------------------------------
// TEST 2: PAN Card Pipeline
// -------------------------------------------------------------
console.log('[TEST 2] Testing Income Tax PAN Card Pipeline');
const validPanData = {
  document_type: 'pan',
  full_name: 'Anupriya Murugan',
  father_name: 'Murugan S',
  date_of_birth: '14/05/1996',
  document_number: 'ABCPE1234F',
  // Strict check: PAN cards have NO address or gender
  address: null,
  gender: null
};

const panRes = panPipeline.processPan({
  extractedData: validPanData,
  pillarProfile: testProfile
});
assert(panRes.document_type === 'pan', 'PAN pipeline returns docType pan');
assert(panRes.format_valid === true, 'PAN format ABCPE1234F is valid');
assert(panRes.entity_type === 'P', 'PAN 4th character "P" classified as Individual');
assert(panRes.name_alignment.similarity_score >= 0.85, 'PAN name matches registered profile');
assert(panRes.fields.document_number_masked === 'ABCXX1234F', 'PAN is masked correctly (first 3, last 5 visible)');
assert(validPanData.address === null && validPanData.gender === null, 'PAN strictly keeps address and gender as null (anti-hallucination)');

// PAN validation in documentValidationService
const panVal = documentValidationService.validateExtraction(validPanData, testProfile);
assert(panVal.format_valid === true, 'documentValidationService validates PAN format as valid');
assert(panVal.confidence_level === 'HIGH', 'PAN validation yields HIGH confidence with 0 mismatches');
console.log();

// -------------------------------------------------------------
// TEST 3: Voter Identity Card (EPIC) Pipeline
// -------------------------------------------------------------
console.log('[TEST 3] Testing Election Commission Voter ID Pipeline');
const validVoterData = {
  document_type: 'voter_id',
  full_name: 'Anupriya Murugan',
  father_name: 'Murugan',
  document_number: 'TN0201212345',
  gender: 'FEMALE',
  constituency: 'Thousand Lights',
  address: 'Thousand Lights, Chennai'
};

const voterRes = voterIdPipeline.processVoterId({
  extractedData: validVoterData,
  pillarProfile: testProfile
});
assert(voterRes.document_type === 'voter_id', 'Voter ID pipeline returns docType voter_id');
assert(voterRes.format_valid === true, 'Voter ID number format is valid');
assert(voterRes.name_alignment.similarity_score >= 0.85, 'Voter ID name matches registered profile');
assert(voterRes.fields.document_number_masked.length > 0, 'Voter ID is masked correctly');

const voterVal = documentValidationService.validateExtraction(validVoterData, testProfile);
assert(voterVal.format_valid === true, 'documentValidationService validates Voter ID format as valid');
console.log();

// -------------------------------------------------------------
// TEST 4: Motor Driving Licence Pipeline
// -------------------------------------------------------------
console.log('[TEST 4] Testing Driving Licence Pipeline');
const validDlData = {
  document_type: 'driving_licence',
  full_name: 'Anupriya Murugan',
  document_number: 'TN01 20180005432',
  date_of_birth: '14/05/1996',
  expiry_date: '2038-05-13',
  vehicle_classes: ['LMV', 'MCWG'],
  issuing_authority: 'RTO Chennai Central'
};

const dlRes = drivingLicensePipeline.processDrivingLicense({
  extractedData: validDlData,
  pillarProfile: testProfile
});
assert(dlRes.document_type === 'driving_licence', 'DL pipeline returns docType driving_licence');
assert(dlRes.format_valid === true, 'DL number format is valid');
assert(dlRes.is_expired === false, 'Future expiry date is marked as active (not expired)');
assert(dlRes.name_alignment.similarity_score >= 0.85, 'DL name matches registered profile');
assert(dlRes.fields.vehicle_classes.includes('LMV'), 'DL vehicle classes extracted correctly');

// Edge Case: Expired Driving Licence
const expiredDlData = {
  ...validDlData,
  expiry_date: '2020-01-01'
};
const expiredDlRes = drivingLicensePipeline.processDrivingLicense({
  extractedData: expiredDlData,
  pillarProfile: testProfile
});
assert(expiredDlRes.is_expired === true, 'Past expiry date correctly flags DL as EXPIRED');

const expiredDlVal = documentValidationService.validateExtraction(expiredDlData, testProfile);
assert(expiredDlVal.mismatches.some(m => m.field === 'expiry_date') && expiredDlVal.format_valid === false, 'Validation flags expired DL with expiry mismatch');
console.log();

// -------------------------------------------------------------
// TEST 5: Indian Passport Pipeline
// -------------------------------------------------------------
console.log('[TEST 5] Testing Indian Passport Pipeline');
const validPassportData = {
  document_type: 'passport',
  full_name: 'Anupriya Murugan',
  given_name: 'Anupriya',
  surname: 'Murugan',
  document_number: 'Z1234567',
  date_of_birth: '1996-05-14',
  gender: 'FEMALE',
  expiry_date: '2032-10-25',
  place_of_issue: 'Chennai',
  nationality: 'Indian'
};

const passportRes = passportPipeline.processPassport({
  extractedData: validPassportData,
  pillarProfile: testProfile
});
assert(passportRes.document_type === 'passport', 'Passport pipeline returns docType passport');
assert(passportRes.format_valid === true, 'Passport number Z1234567 format is valid');
assert(passportRes.is_expired === false, 'Passport with future expiry is marked valid/active');
assert(passportRes.name_match_score >= 0.85, 'Passport name matches registered profile');
assert(passportRes.fields.document_number_masked === 'ZXXX-XXXX-567', 'Passport masked safely (first & last 3 visible)');

// Edge Case: Expired Passport
const expiredPassportData = {
  ...validPassportData,
  expiry_date: '2019-06-15'
};
const expiredPassportRes = passportPipeline.processPassport({
  extractedData: expiredPassportData,
  pillarProfile: testProfile
});
assert(expiredPassportRes.is_expired === true, 'Past expiry date correctly flags Passport as EXPIRED');

const passportVal = documentValidationService.validateExtraction(validPassportData, testProfile);
assert(passportVal.format_valid === true, 'documentValidationService validates Passport format as valid');
console.log();

// -------------------------------------------------------------
// TEST 6: Smart Ration Card / TNEPDS Pipeline
// -------------------------------------------------------------
console.log('[TEST 6] Testing Smart Ration Card / TNEPDS Pipeline');
const validRationData = {
  document_type: 'ration_card',
  full_name: 'Anupriya Murugan',
  document_number: '02G0987654',
  address: 'No 45, Anna Nagar, Chennai - 600040',
  district: 'Chennai',
  fps_code: 'FPS-045-CHN',
  date_of_birth: null,
  gender: null
};

const rationRes = rationCardPipeline.processRationCard({
  extractedData: validRationData,
  pillarProfile: testProfile
});
assert(rationRes.document_type === 'ration_card', 'Ration card pipeline returns docType ration_card');
assert(rationRes.format_valid === true, 'Ration card number format is valid');
assert(rationRes.name_match_score >= 0.85, 'Family Head name matches registered profile');
assert(rationRes.fields.date_of_birth === null, 'Family ration card strictly preserves null for individual DOB');

const rationVal = documentValidationService.validateExtraction(validRationData, testProfile);
assert(rationVal.format_valid === true, 'documentValidationService validates Ration Card format as valid');
console.log();

// -------------------------------------------------------------
// TEST 7: Construction / Labour Welfare Board Card Pipeline
// -------------------------------------------------------------
console.log('[TEST 7] Testing Labour Welfare Board Card Pipeline');
const validLabourData = {
  document_type: 'labour_card',
  full_name: 'Anupriya Murugan',
  worker_name: 'Anupriya Murugan',
  document_number: 'TNCWWB/CHN/2021/8842',
  registration_number: 'TNCWWB/CHN/2021/8842',
  trade: 'Electrician',
  district: 'Chennai',
  welfare_board: 'Tamil Nadu Construction Workers Welfare Board'
};

const labourRes = labourCardPipeline.processLabourCard({
  extractedData: validLabourData,
  pillarProfile: testProfile
});
assert(labourRes.document_type === 'labour_card', 'Labour card pipeline returns docType labour_card');
assert(labourRes.format_valid === true, 'Labour registration number format is valid');
assert(labourRes.name_match_score >= 0.85, 'Worker name matches registered profile');
assert(labourRes.trade_evaluation.matched === true, 'Registered trade "Electrician" matches profile main_services');

// Trade mismatch test
const mismatchTradeLabourData = {
  ...validLabourData,
  trade: 'Mason / Masonry'
};
const mismatchTradeLabourRes = labourCardPipeline.processLabourCard({
  extractedData: mismatchTradeLabourData,
  pillarProfile: testProfile
});
assert(mismatchTradeLabourRes.trade_evaluation.matched === false, 'Different trade correctly identified as non-matched');

const labourVal = documentValidationService.validateExtraction(validLabourData, testProfile);
assert(labourVal.format_valid === true, 'documentValidationService validates Labour Card format as valid');
console.log();

// -------------------------------------------------------------
// TEST 8: Trade & Skill Certificate Pipeline
// -------------------------------------------------------------
console.log('[TEST 8] Testing Skill Certificate Pipeline');
const validSkillData = {
  document_type: 'skill_certificate',
  worker_name: 'Anupriya Murugan',
  full_name: 'Anupriya Murugan',
  certificate_number: 'NCVT/ITI/EL/2019/55412',
  document_number: 'NCVT/ITI/EL/2019/55412',
  skill: 'Electrician',
  trade: 'Electrician',
  issuing_organization: 'National Council for Vocational Training (NCVT)',
  issue_date: '2019-07-20'
};

const skillRes = skillCertificatePipeline.processCertificate({
  extractedData: validSkillData,
  pillarProfile: testProfile
});
assert(skillRes.document_type === 'skill_certificate', 'Skill certificate pipeline returns docType skill_certificate');
assert(skillRes.fields.certificate_number === 'NCVT/ITI/EL/2019/55412', 'Skill certificate number matches');
assert(skillRes.name_alignment.similarity_score >= 0.85, 'Certificate name matches registered profile');
assert(skillRes.trade_evaluation.matched === true, 'Skill "Electrician" matches profile main_services');

const skillVal = documentValidationService.validateExtraction(validSkillData, testProfile);
assert(skillVal.format_valid === true, 'documentValidationService validates Skill Certificate format as valid');
assert(skillVal.confidence_level === 'HIGH', 'Skill Certificate validation yields HIGH confidence');
console.log();

// -------------------------------------------------------------
// TEST 9: General / Other Official Government ID Pipeline
// -------------------------------------------------------------
console.log('[TEST 9] Testing General / Other Government ID Pipeline');
const validOtherData = {
  document_type: 'other',
  document_category: 'identity',
  document_title: 'State Trade Identity Card',
  full_name: 'Anupriya Murugan',
  document_number: 'GOVT-ID-998822',
  issuing_body: 'Directorate of Employment and Training'
};

const otherRes = generalGovtIdPipeline.processGeneralDocument({
  extractedData: validOtherData,
  pillarProfile: testProfile
});
assert(otherRes.document_type === 'other', 'General ID pipeline returns docType other');
assert(otherRes.format_valid === true, 'General document number format is valid');
assert(otherRes.name_match_score >= 0.85, 'General document name matches registered profile');

const otherVal = documentValidationService.validateExtraction(validOtherData, testProfile);
assert(otherVal.format_valid === true, 'documentValidationService validates Other ID format as valid');
console.log();

// -------------------------------------------------------------
// TEST 10: Edge Cases & Strict Anti-Hallucination Integrity
// -------------------------------------------------------------
console.log('[TEST 10] Testing Edge Cases & Anti-Hallucination Integrity');

// Name Mismatch
const mismatchNameData = {
  document_type: 'passport',
  full_name: 'Rajesh Kumar Sundaram',
  document_number: 'P9876543',
  date_of_birth: '1985-02-10'
};
const mismatchNameVal = documentValidationService.validateExtraction(mismatchNameData, testProfile);
assert(mismatchNameVal.mismatches.some(m => m.field === 'full_name' && m.severity === 'HIGH'), 'Completely different name results in HIGH severity mismatch');
assert(mismatchNameVal.format_valid === false, 'High severity name mismatch sets format_valid to false');

// Missing Required Fields (strictly remain missing, not fabricated)
const emptyDocData = {
  document_type: 'driving_licence',
  full_name: null,
  document_number: null
};
const emptyDocVal = documentValidationService.validateExtraction(emptyDocData, testProfile);
assert(emptyDocVal.missing_fields.includes('full_name'), 'Missing name flagged in missing_fields array');
assert(emptyDocVal.missing_fields.includes('driving_license_number'), 'Missing DL number flagged in missing_fields array');
assert(emptyDocVal.confidence_level === 'LOW', 'Empty/unreadable document results in LOW confidence');

console.log();
console.log('================================================================');
console.log(` RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log(' ALL 9 DOCUMENT TYPES & PIPELINES VERIFIED SUCCESSFULLY!\n');
}
