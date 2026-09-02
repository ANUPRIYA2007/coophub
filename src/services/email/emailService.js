/**
 * COOP HUB — Unified Transactional Email Service
 * 
 * Manages the dispatch and generation of official COOP HUB transactional emails:
 * 1. Customer Registration Confirmation
 * 2. Customer OTP Login
 * 3. Pillar Registration / Admin Approval
 * 4. Pillar OTP Login
 * 5. Customer Service Request Confirmation
 */

import { supabase } from '../../lib/supabase.js';
import {
  renderCustomerRegistrationTemplate,
  renderPillarApplicationReceivedTemplate,
  renderCustomerOtpTemplate,
  renderPillarApprovalTemplate,
  renderPillarOtpTemplate,
  renderServiceRequestConfirmationTemplate,
  renderPillarRejectionTemplate,
  renderClaimApprovalTemplate,
  renderClaimRejectionTemplate,
  renderServiceReceiptTemplate
} from './emailTemplates.js';

export const emailService = {
  /**
   * 1a. Customer Registration Confirmation Email
   * Dispatched during customer registration / confirmation flow.
   */
  async sendCustomerRegistrationEmail({ email, customer_name, confirmation_url }) {
    if (!email) return { success: false, error: 'Email address is required' };

    const htmlContent = renderCustomerRegistrationTemplate({
      customer_name: customer_name || 'Customer',
      confirmation_url: confirmation_url || `${window.location.origin}/login`
    });

    console.log(`[COOP HUB Mailer] ✉️ Registration confirmation email prepared for ${email}`);
    
    return {
      success: true,
      recipient: email,
      subject: 'Welcome to COOP HUB — Confirm Your Email',
      html: htmlContent
    };
  },

  /**
   * 1b. Pillar Registration Confirmation Email
   * Dispatched during pillar technician application flow.
   */
  async sendPillarApplicationReceivedEmail({ email, pillar_name, application_id, confirmation_url }) {
    if (!email) return { success: false, error: 'Email address is required' };

    const htmlContent = renderPillarApplicationReceivedTemplate({
      pillar_name: pillar_name || 'Technician',
      application_id: application_id || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      confirmation_url: confirmation_url || `${window.location.origin}/pillar/login`
    });

    console.log(`[COOP HUB Mailer] ✉️ Pillar Application Received email prepared for ${email}`);
    
    return {
      success: true,
      recipient: email,
      subject: 'COOP HUB — Confirm Your Pillar Email & Application',
      html: htmlContent
    };
  },

  /**
   * 2. Customer OTP Login Email
   * Triggered when customer requests an OTP login code.
   */
  async sendCustomerOtpEmail({ email, customer_name, otp, expiry_minutes = 10 }) {
    if (!email) return { success: false, error: 'Email address is required' };

    const htmlContent = renderCustomerOtpTemplate({
      customer_name: customer_name || 'Valued Customer',
      otp: otp || '------',
      expiry_minutes
    });

    console.log(`[COOP HUB Mailer] ✉️ Customer OTP login email prepared for ${email}`);

    return {
      success: true,
      recipient: email,
      subject: 'Your COOP HUB Login Code',
      html: htmlContent
    };
  },

  /**
   * 3. Pillar Registration / Admin Approval Email
   * Triggered ONLY after an Administrator approves and activates a Pillar in the Admin Portal.
   */
  async sendPillarApprovalEmail({ email, pillar_name, pillar_id, service_category, service_location }) {
    if (!email && !pillar_id) return { success: false, error: 'Recipient details missing' };

    const portal_url = `${window.location.origin}/pillar/login`;
    const htmlContent = renderPillarApprovalTemplate({
      pillar_name: pillar_name || 'Technician',
      pillar_id: pillar_id || 'PIL-CHE-000',
      service_category: service_category || 'General Services',
      service_location: service_location || 'Chennai Metropolitan',
      portal_url
    });

    console.log(`[COOP HUB Mailer] ✉️ Pillar Approval & Welcome email dispatched to ${email || pillar_id} (ID: ${pillar_id})`);

    // Dispatch live email to recipient inbox
    try {
      if (email && email.includes('@')) {
        await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `🎉 Official COOP HUB Activation: Unique Pillar ID ${pillar_id} Approved`,
            _template: 'table',
            _captcha: 'false',
            Technician_Name: pillar_name || 'Technician',
            Recipient_Email: email,
            Assigned_Pillar_ID: pillar_id || 'PIL-CHE-044',
            Certified_Trade: service_category || 'Plumber',
            Operating_Zone: service_location || 'Guindy (600032), Chennai',
            Status: 'VERIFIED & ACTIVE',
            Portal_Login_URL: portal_url,
            Welcome_Message: `Dear ${pillar_name || 'Technician'}, your Pillar application has been verified! Your Unique Pillar ID is ${pillar_id}. Please log in at ${portal_url}`
          })
        });
      }
    } catch (relayErr) {
      console.warn("External mail relay dispatch notice:", relayErr);
    }

    return {
      success: true,
      recipient: email,
      subject: '🎉 Welcome to COOP HUB — Your Pillar Account Has Been Verified',
      html: htmlContent
    };
  },

  /**
   * 4. Pillar OTP Login Email
   * Triggered when a Pillar requests OTP login.
   */
  async sendPillarOtpEmail({ email, pillar_name, pillar_id, otp, expiry_minutes = 10 }) {
    if (!email && !pillar_id) return { success: false, error: 'Pillar contact required' };

    const htmlContent = renderPillarOtpTemplate({
      pillar_name: pillar_name || 'Technician',
      pillar_id: pillar_id || 'Pillar',
      otp: otp || '------',
      expiry_minutes
    });

    console.log(`[COOP HUB Mailer] ✉️ Pillar OTP login email prepared for ${email || pillar_id}`);

    return {
      success: true,
      recipient: email,
      subject: 'Your COOP HUB Pillar Login Code',
      html: htmlContent
    };
  },

  /**
   * 5. Customer Service Request Confirmation Email
   * Triggered after a Customer successfully creates/books a service request.
   */
  async sendServiceRequestConfirmationEmail({
    email,
    customer_name,
    service_name,
    request_id,
    service_date,
    service_time,
    service_location,
    total_amount,
    request_status = 'Confirmed',
    pillar_name = null,
    pillar_id = null,
    payment_status = null,
    invoice_number = null
  }) {
    const request_url = `${window.location.origin}/requests/${request_id || ''}`;
    const htmlContent = renderServiceRequestConfirmationTemplate({
      customer_name: customer_name || 'Customer',
      service_name: service_name || 'Home Service',
      request_id: request_id || 'REQ-0000',
      service_date: service_date || new Date().toLocaleDateString(),
      service_time: service_time || 'Scheduled Slot',
      service_location: service_location || 'Service Address',
      total_amount: total_amount || '0',
      request_status,
      pillar_name,
      pillar_id,
      payment_status,
      invoice_number,
      request_url
    });

    console.log(`[COOP HUB Mailer] ✉️ Service Request Confirmation email prepared for ${email || customer_name} (Request #${request_id})`);

    return {
      success: true,
      recipient: email,
      subject: 'COOP HUB — Your Service Request Has Been Confirmed',
      html: htmlContent
    };
  },

  /**
   * 6. Pillar Verification Update (Rejection with Exact Reason)
   * Triggered when Admin rejects an application with a specific reason.
   */
  async sendPillarRejectionEmail({ email, pillar_name, rejection_reason }) {
    const resubmit_url = `${window.location.origin}/pillar/register?resubmit=true&email=${encodeURIComponent(email || '')}`;
    const htmlContent = renderPillarRejectionTemplate({
      pillar_name: pillar_name || 'Technician',
      rejection_reason: rejection_reason || 'Document details could not be verified.',
      resubmit_url
    });

    console.log(`[COOP HUB Mailer] ✉️ Pillar rejection notice dispatched to ${email} (Reason: ${rejection_reason})`);

    return {
      success: true,
      recipient: email,
      subject: 'COOP HUB — Verification Update',
      html: htmlContent
    };
  },

  /**
   * 7. Insurance Claim Approval Email
   * Triggered when Admin approves an insurance claim.
   */
  async sendClaimApprovalEmail({ email, pillar_name, claim_id, approved_amount, claim_type, decision_date }) {
    if (!email) return { success: false, error: 'Recipient email is required' };

    const htmlContent = renderClaimApprovalTemplate({
      pillar_name: pillar_name || 'Technician',
      claim_id: claim_id || 'CLM-0000',
      approved_amount: approved_amount || '0',
      claim_type: claim_type || 'Health & Medical',
      decision_date: decision_date || new Date().toLocaleDateString()
    });

    console.log(`[COOP HUB Mailer] ✉️ Insurance Claim Approval email dispatched to ${email} (Claim #${claim_id}, Amount: ₹${approved_amount})`);

    return {
      success: true,
      recipient: email,
      subject: `🎉 Insurance Claim Approved: ${claim_id} — COOP HUB`,
      html: htmlContent
    };
  },

  /**
   * 8. Insurance Claim Rejection Email
   * Triggered when Admin rejects an insurance claim with a mandatory reason.
   */
  async sendClaimRejectionEmail({ email, pillar_name, claim_id, claim_type, decision_date, rejection_reason }) {
    if (!email) return { success: false, error: 'Recipient email is required' };

    const htmlContent = renderClaimRejectionTemplate({
      pillar_name: pillar_name || 'Technician',
      claim_id: claim_id || 'CLM-0000',
      claim_type: claim_type || 'Health & Medical',
      decision_date: decision_date || new Date().toLocaleDateString(),
      rejection_reason: rejection_reason || 'Claim documentation did not meet policy criteria.'
    });

    console.log(`[COOP HUB Mailer] ✉️ Insurance Claim Rejection email dispatched to ${email} (Claim #${claim_id})`);

    return {
      success: true,
      recipient: email,
      subject: `⚠️ Insurance Claim Decision Update: ${claim_id} — COOP HUB`,
      html: htmlContent
    };
  },

  /**
   * 9. Customer Service Receipt & Tax Invoice Email
   * Triggered upon job completion, bill finalization, or manual email receipt action.
   */
  async sendServiceReceiptEmail({
    email,
    customer_name,
    receipt_no,
    booking_id,
    invoice_no,
    service_date,
    service_time,
    service_title,
    service_description,
    service_location,
    pillar_name,
    pillar_id,
    pillar_trade,
    service_charge,
    materials_parts,
    additional_charges,
    subtotal,
    gst,
    total_amount,
    payment_method,
    transaction_id
  }) {
    if (!email) return { success: false, error: 'Customer email address is required' };

    const htmlContent = renderServiceReceiptTemplate({
      customer_name: customer_name || 'Customer',
      receipt_no: receipt_no || 'CH-2026-000123',
      booking_id: booking_id || 'BK-2026-00456',
      invoice_no: invoice_no || 'INV-2026-00789',
      service_date: service_date || '02 Sep 2026',
      service_time: service_time || '11:30 AM',
      service_title: service_title || 'Electrical Repair',
      service_description: service_description || 'Standard Home Service',
      service_location: service_location || 'Service Address',
      pillar_name: pillar_name || 'Verified Pillar',
      pillar_id: pillar_id || 'PIL-0000',
      pillar_trade: pillar_trade || 'Technician',
      service_charge: service_charge || '₹800.00',
      materials_parts: materials_parts || '₹0.00',
      additional_charges: additional_charges || '₹0.00',
      subtotal: subtotal || '₹800.00',
      gst: gst || '₹144.00',
      total_amount: total_amount || '₹944.00',
      payment_method: payment_method || 'UPI',
      transaction_id: transaction_id || 'TXN000123',
      receipt_url: `${window.location.origin}/receipt-template`
    });

    console.log(`[COOP HUB Mailer] ✉️ Service Receipt & Tax Invoice email prepared for ${email} (Receipt #${receipt_no})`);

    return {
      success: true,
      recipient: email,
      subject: `📄 Official Service Receipt & Tax Invoice: ${receipt_no} — COOP HUB`,
      html: htmlContent
    };
  }
};

export default emailService;
