import { createClient } from '@supabase/supabase-js';
import {
  renderCustomerRegistrationTemplate,
  renderPillarApplicationReceivedTemplate,
  renderCustomerOtpTemplate,
  renderPillarApprovalTemplate,
  renderPillarOtpTemplate,
  renderServiceRequestConfirmationTemplate,
  renderPillarRejectionTemplate,
  renderClaimApprovalTemplate,
  renderClaimRejectionTemplate
} from '../src/services/email/emailTemplates.js';

const SUPABASE_URL = 'https://aqzkzaswckfoazpqeeti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemt6YXN3Y2tmb2F6cHFlZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzQ0MTcsImV4cCI6MjEwMzMxMDQxN30.i12_jN5wynPCnCpoh-0AO66Zi1fp1Mea-Do-mpzP8yw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDiagnostics() {
  console.log('====================================================');
  console.log('🧪 1. TESTING EMAIL TEMPLATES COMPILATION & RENDERING');
  console.log('====================================================');

  const templates = [
    { name: 'Customer Registration', fn: () => renderCustomerRegistrationTemplate({ customer_name: 'Dhanusri', confirmation_url: 'https://coophub.in/verify' }) },
    { name: 'Pillar Application Received', fn: () => renderPillarApplicationReceivedTemplate({ pillar_name: 'Murugan', confirmation_url: 'https://coophub.in/pillar/verify' }) },
    { name: 'Customer OTP Login', fn: () => renderCustomerOtpTemplate({ customer_name: 'Dhanusri', otp: '489201' }) },
    { name: 'Pillar Approval', fn: () => renderPillarApprovalTemplate({ pillar_name: 'Murugan', pillar_id: 'PIL-CHE-042', service_category: 'Electrical Repair', service_location: 'Chennai' }) },
    { name: 'Pillar OTP Login', fn: () => renderPillarOtpTemplate({ pillar_name: 'Murugan', otp: '739102' }) },
    { name: 'Service Request Confirmation', fn: () => renderServiceRequestConfirmationTemplate({ customer_name: 'Dhanusri', booking_id: 'REQ-2026-99', service_name: 'AC Repair', scheduled_time: 'Tomorrow, 10:00 AM' }) },
    { name: 'Pillar Rejection', fn: () => renderPillarRejectionTemplate({ pillar_name: 'Murugan', reason: 'Aadhaar copy is blurry.' }) },
    { name: 'Claim Approval', fn: () => renderClaimApprovalTemplate({ pillar_name: 'Murugan', claim_id: 'CLM-001', approved_amount: '25,000' }) },
    { name: 'Claim Rejection', fn: () => renderClaimRejectionTemplate({ pillar_name: 'Murugan', claim_id: 'CLM-002', reason: 'Policy limit exceeded.' }) }
  ];

  let templateSuccess = 0;
  for (const t of templates) {
    try {
      const html = t.fn();
      if (html && html.includes('COOP') && !html.includes('undefined') && !html.includes('NaN')) {
        console.log(`✅ [PASS] ${t.name}: rendered ${html.length} bytes`);
        templateSuccess++;
      } else {
        console.error(`❌ [FAIL] ${t.name}: contains undefined or invalid markup`);
      }
    } catch (err) {
      console.error(`❌ [FAIL] ${t.name}: error ${err.message}`);
    }
  }

  console.log(`\nResult: ${templateSuccess}/${templates.length} templates verified successfully.\n`);

  console.log('====================================================');
  console.log('🧪 2. TESTING SUPABASE OTP / AUTH DISPATCH API');
  console.log('====================================================');

  const testEmail = 'ctrlaltdefeat034@gmail.com';
  console.log(`📡 Sending signInWithOtp for: ${testEmail}...`);

  const startTime = Date.now();
  const { data, error } = await supabase.auth.signInWithOtp({
    email: testEmail,
    options: {
      shouldCreateUser: false
    }
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (error) {
    console.log(`⏱️ Supabase API responded in ${duration}s`);
    console.log(`⚠️ Supabase Auth response note:`, error.message);
    console.log(`Status Code:`, error.status || 'N/A');
    if (error.message?.includes('Signups not allowed for otp') || error.message?.includes('User not found')) {
      console.log('💡 Note: User must first be signed up with email & password before requesting a login OTP.');
    } else if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('security')) {
      console.log('💡 Note: Supabase rate limit active (max 1 request per 60s per email).');
    }
  } else {
    console.log(`🎉 Supabase successfully dispatched OTP in ${duration}s!`);
    console.log(`Data:`, data);
  }

  console.log('====================================================');
}

runDiagnostics().catch(console.error);
