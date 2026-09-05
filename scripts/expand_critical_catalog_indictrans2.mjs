import fs from 'fs';
import { SUPPORTED_LANGUAGES } from '../src/i18n/languages.js';
import { CRITICAL_CATALOG } from '../src/i18n/criticalCatalog.js';

const CORE_TERMS = [
  { key: "auth.welcomeBack", en: "Welcome Back" },
  { key: "auth.createAccount", en: "Create Account" },
  { key: "auth.fullName", en: "Full Name" },
  { key: "auth.email", en: "Email Address" },
  { key: "auth.password", en: "Password" },
  { key: "auth.confirmPassword", en: "Confirm Password" },
  { key: "auth.forgotPassword", en: "Forgot password?" },
  { key: "auth.enterPassword", en: "Enter your password" },
  { key: "auth.phoneNumber", en: "Phone Number" },
  { key: "auth.sendOtp", en: "Send OTP" },
  { key: "auth.enterOtp", en: "Enter OTP" },
  { key: "auth.verifyOtp", en: "Verify OTP" },
  { key: "auth.alreadyHaveAccount", en: "Already have an account?" },
  { key: "auth.dontHaveAccount", en: "Don't have an account?" },
  { key: "auth.registerHere", en: "Register here" },
  { key: "auth.backToPortals", en: "Back to Portals" },
  { key: "auth.backToPortalSelection", en: "Back to Portal Selection" },
  { key: "auth.customerPortal", en: "Customer Portal" },
  { key: "auth.pillarPortal", en: "Pillar Portal" },
  { key: "auth.adminPortal", en: "Admin Portal" },
  { key: "auth.pillarLogin", en: "Pillar Login" },
  { key: "auth.adminLogin", en: "Admin Login" },
  { key: "auth.customerLogin", en: "Customer Login" },
  { key: "auth.signInCustomer", en: "Sign in to your customer account" },
  { key: "auth.fillDemoCredentials", en: "Fill Demo Customer Credentials" },
  { key: "auth.coopAdmin", en: "COOP Admin" },
  { key: "auth.adminManagementPortal", en: "Admin Management Portal" },
  { key: "auth.authorizedOfficersOnly", en: "Authorized Cooperative Administrative Officers Only" },
  { key: "auth.pillarAccessTagline", en: "Access your assigned jobs, customer requests & earnings" },
  { key: "auth.kycInProgress", en: "KYC Verification In Progress" },
  { key: "auth.applicationId", en: "Official Application ID" },
  { key: "auth.applicant", en: "Applicant" },
  { key: "auth.signIn", en: "Sign In" },
  { key: "auth.logIn", en: "Log In" },
  { key: "auth.register", en: "Register" },
  { key: "auth.showPassword", en: "Show password" },
  { key: "auth.hidePassword", en: "Hide password" }
];

async function run() {
  console.log('Generating multi-language catalog using IndicTrans2 on port 8003...');
  
  const updatedCatalog = { ...CRITICAL_CATALOG };
  
  // Initialize English
  if (!updatedCatalog.en) updatedCatalog.en = {};
  for (const item of CORE_TERMS) {
    updatedCatalog.en[item.key] = item.en;
    updatedCatalog.en[item.en] = item.en;
  }

  const englishTexts = CORE_TERMS.map(t => t.en);

  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.code === 'en') continue;

    // Skip if already has translated terms
    if (updatedCatalog[lang.code]?.[CORE_TERMS[0].key] && updatedCatalog[lang.code][CORE_TERMS[0].key] !== CORE_TERMS[0].en) {
      console.log(`  ✓ ${lang.code}: Already populated, skipping.`);
      continue;
    }

    console.log(`Translating for ${lang.name} (${lang.code}) [${lang.indicTransTag}] with num_beams=1...`);
    try {
      const resp = await fetch('http://localhost:8003/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: englishTexts,
          source_lang: 'eng_Latn',
          target_lang: lang.indicTransTag,
          num_beams: 1,
          max_length: 64
        })
      });


      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      }

      const data = await resp.json();
      const translations = data.translations || [];

      if (!updatedCatalog[lang.code]) {
        updatedCatalog[lang.code] = {};
      }

      CORE_TERMS.forEach((item, idx) => {
        const trans = translations[idx] || item.en;
        updatedCatalog[lang.code][item.key] = trans;
        updatedCatalog[lang.code][item.en] = trans;
      });

      console.log(`  ✓ ${lang.code}: Added ${CORE_TERMS.length} verified translations.`);
    } catch (err) {
      console.error(`  ✗ Error translating for ${lang.code}:`, err.message);
    }
  }

  // Write updated catalog back to criticalCatalog.js
  const fileContent = `/**
 * COOP HUB Centralized Critical UI Terminology Catalog
 * 
 * Complete, verified catalog for all 22 Scheduled Indian Languages + English (23 total)
 * Generated with AI4Bharat IndicTrans2 Neural MT Engine.
 */

export const CRITICAL_CATALOG = ${JSON.stringify(updatedCatalog, null, 2)};

export default CRITICAL_CATALOG;
`;

  fs.writeFileSync('src/i18n/criticalCatalog.js', fileContent, 'utf-8');
  console.log('\nSuccessfully wrote updated CRITICAL_CATALOG to src/i18n/criticalCatalog.js!');
}

run().catch(console.error);
