/**
 * COOP HUB — Official Transactional Email Templates
 * 
 * Global Brand Colors:
 * - Deep Navy: #162238
 * - Dark Navy: #050A12
 * - Primary Brand Orange: #FF7900
 * - Orange Hover: #E66A00
 * - White: #FFFFFF
 * - Light Background: #F5F7FA
 * - Primary Text: #0B1220
 * - Secondary Text: #64748B
 * - Success: #10B981
 */

// Shared base layout wrapper for all transactional emails
function baseEmailWrapper({ title, portalBadge, contentHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F5F7FA;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0B1220;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #FF7900;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #FF7900;
      color: #FFFFFF !important;
      padding: 14px 28px;
      font-size: 15px;
      font-weight: 700;
      text-align: center;
      border-radius: 8px;
      display: inline-block;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(255, 121, 0, 0.25);
    }
    @media only screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        padding: 12px !important;
      }
      .content-card {
        padding: 24px 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F5F7FA;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <!-- Main 600px Container -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color: #050A12; padding: 24px 32px; border-radius: 16px 16px 0 0; text-align: left; border-bottom: 2px solid #FF7900;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px;">
                      COOP <span style="color: #FF7900;">HUB</span>
                    </div>
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      ${portalBadge || 'Unified Service Platform'}
                    </div>
                  </td>
                  <td align="right">
                    <span style="background: rgba(255, 121, 0, 0.15); color: #FF7900; border: 1px solid rgba(255, 121, 0, 0.3); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">
                      Official Dispatch
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Card Surface -->
          <tr>
            <td class="content-card" style="background-color: #FFFFFF; padding: 36px 32px; border-left: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #162238; padding: 24px 32px; border-radius: 0 0 16px 16px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.6; border-top: 1px solid rgba(255,255,255,0.08);">
              <div style="font-weight: 700; color: #FFFFFF; font-size: 13px; margin-bottom: 6px;">
                COOP HUB • Cooperative Service Ecosystem
              </div>
              <div style="color: #64748B; margin-bottom: 12px;">
                Connecting Verified Skilled Workforce with Urban Citizens.
              </div>
              <div style="color: #475569; font-size: 11px;">
                © ${new Date().getFullYear()} COOP HUB. All rights reserved. • This is an automated transactional communication.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// 1. CUSTOMER REGISTRATION CONFIRMATION EMAIL
// ============================================================================
export function renderCustomerRegistrationTemplate({ customer_name = 'Customer', confirmation_url = '#' }) {
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${customer_name}</strong>,
    </div>

    <h1 style="font-size: 24px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0; line-height: 1.3;">
      Welcome to COOP HUB! 🎉
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 12px 0;">
      Your account has been successfully created.
    </p>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 28px 0;">
      To activate your COOP HUB account and securely access your Customer Portal, please confirm your email address.
    </p>

    <!-- Confirmation CTA Button -->
    <div style="text-align: center; margin: 28px 0 32px 0;">
      <a href="${confirmation_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        CONFIRM MY EMAIL
      </a>
    </div>

    <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin: 0 0 28px 0; text-align: center;">
      This confirmation link is required to verify your email before you can fully access your account.
    </p>

    <!-- What you can do section -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
      <div style="font-size: 13px; font-weight: 800; color: #0B1220; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        WHAT YOU CAN DO WITH COOP HUB
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Discover trusted service professionals</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Book services easily</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Track your service requests</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Chat securely with your Pillar</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Call your Pillar without exposing phone numbers</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Track live location when available</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Make secure payments</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Access invoices and payment history</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Give optional feedback and ratings</td></tr>
        <tr><td style="padding: 2px 0;"><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Get multilingual support</td></tr>
      </table>
    </div>

    <!-- Security Note -->
    <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 12px; color: #64748B; line-height: 1.6;">
      <strong style="color: #0B1220;">SECURITY</strong><br />
      If you did not create this COOP HUB account, safely ignore this email.<br />
      For security, never share your password or verification information with anyone.
    </div>
  `;

  return baseEmailWrapper({
    title: 'Welcome to COOP HUB — Confirm Your Email',
    portalBadge: 'Unified Service Platform',
    contentHtml
  });
}

// ============================================================================
// 1b. PILLAR REGISTRATION CONFIRMATION EMAIL (Application Under Review)
// ============================================================================
export function renderPillarApplicationReceivedTemplate({ pillar_name = 'Technician', application_id = 'APP-2026-PENDING', confirmation_url = '#' }) {
  const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/pillar/login` : 'https://coophub.in/pillar/login';
  const actionUrl = confirmation_url && confirmation_url !== '#' ? confirmation_url : portalUrl;

  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${pillar_name}</strong>,
    </div>

    <h1 style="font-size: 24px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0; line-height: 1.3;">
      Pillar Application Received! 🛠️
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
      Thank you for applying to join the <strong>COOP HUB Cooperative Skilled Workforce</strong>. Your registration details and government identity document have been safely recorded.
    </p>

    <!-- Official Application ID Card -->
    <div style="background-color: #050A12; border: 2px solid #FF7900; border-radius: 14px; padding: 22px 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; color: #FF7900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
        YOUR OFFICIAL APPLICATION ID
      </div>
      <div style="font-size: 28px; font-weight: 900; color: #FFFFFF; letter-spacing: 3px; font-family: 'Courier New', Courier, monospace;">
        ${application_id}
      </div>
      <div style="font-size: 12px; color: #94A3B8; margin-top: 6px;">
        Use this Application ID to track your KYC and verification progress.
      </div>
    </div>

    <!-- Application Lifecycle Table -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
      <div style="font-size: 13px; font-weight: 800; color: #0B1220; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        WHAT HAPPENS NEXT?
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13.5px; color: #334155; line-height: 1.8;">
        <tr>
          <td style="padding: 6px 0; vertical-align: top; width: 28px;">
            <span style="background-color: #FF7900; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 50%;">1</span>
          </td>
          <td style="padding: 6px 0;">
            <strong>Document Verification:</strong> Cooperative Administration audits your uploaded Aadhaar / Government ID.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top; width: 28px;">
            <span style="background-color: #FF7900; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 50%;">2</span>
          </td>
          <td style="padding: 6px 0;">
            <strong>Application Clearance:</strong> Once verified against your Application ID, an official <strong>Unique Pillar ID</strong> (e.g. <code>PIL-CHE-042</code>) will be generated.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top; width: 28px;">
            <span style="background-color: #FF7900; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 50%;">3</span>
          </td>
          <td style="padding: 6px 0;">
            <strong>Workforce Activation:</strong> You will receive an approval email with your Pillar ID to log in and start receiving service bookings.
          </td>
        </tr>
      </table>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin: 24px 0 28px 0;">
      <a href="${actionUrl}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        TRACK APPLICATION STATUS
      </a>
    </div>

    <!-- Security Note -->
    <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 12px; color: #64748B; line-height: 1.6;">
      <strong style="color: #0B1220;">COOPERATIVE ASSISTANCE</strong><br />
      Need assistance? Contact the Cooperative Pillar Desk with your Application ID for priority support.
    </div>
  `;

  return baseEmailWrapper({
    title: 'COOP HUB — Pillar Application Received',
    portalBadge: 'Cooperative Skilled Workforce Registry',
    contentHtml
  });
}

// ============================================================================
// 2. CUSTOMER OTP LOGIN EMAIL
// ============================================================================
export function renderCustomerOtpTemplate({ customer_name = 'Valued Customer', otp = '------', expiry_minutes = 10 }) {
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${customer_name}</strong>,
    </div>

    <h1 style="font-size: 22px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0;">
      Your COOP HUB Login Code
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
      Use the verification code below to securely sign in to your COOP HUB Customer Portal.
    </p>

    <!-- OTP Display Box -->
    <div style="background-color: #050A12; border: 2px solid #FF7900; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; color: #FF7900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        YOUR LOGIN CODE
      </div>
      <div style="font-size: 36px; font-weight: 900; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
        ${otp}
      </div>
      <div style="font-size: 12px; color: #94A3B8; margin-top: 8px;">
        This code will expire in ${expiry_minutes} minutes.
      </div>
    </div>

    <!-- Security Notice -->
    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; color: #92400E; line-height: 1.5;">
      <strong>SECURITY NOTICE</strong><br />
      • Never share this OTP with anyone.<br />
      • COOP HUB will never ask you to share your login verification code.<br />
      • If you did not attempt to sign in, safely ignore this email.
    </div>

    <div style="font-size: 13px; color: #64748B;">
      Need help? <a href="#" style="color: #FF7900; font-weight: 700;">COOP HUB → Help & Support</a>
    </div>
  `;

  return baseEmailWrapper({
    title: 'Your COOP HUB Login Code',
    portalBadge: 'Unified Service Platform',
    contentHtml
  });
}

// ============================================================================
// 3. PILLAR REGISTRATION / ADMIN APPROVAL EMAIL
// ============================================================================
export function renderPillarApprovalTemplate({ 
  pillar_name = 'Technician', 
  pillar_id = 'PIL-CHE-000', 
  service_category = 'General Maintenance', 
  service_location = 'Chennai Metropolitan',
  portal_url = '#'
}) {
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${pillar_name}</strong>,
    </div>

    <h1 style="font-size: 24px; font-weight: 800; color: #0B1220; margin: 0 0 8px 0;">
      🎉 Congratulations!
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 8px 0;">
      Your Pillar registration has been successfully verified and approved by the COOP HUB Admin team.
    </p>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
      You are now officially part of the COOP HUB family. 🤝
    </p>

    <!-- Verified & Approved Badge Card -->
    <div style="background-color: #F8FAFC; border: 1px solid #10B981; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px;">
        <span style="background: #10B981; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 10px; text-transform: uppercase;">
          VERIFIED & APPROVED
        </span>
      </div>

      <div style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
        PILLAR DETAILS
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #0B1220;">
        <tr>
          <td style="padding: 4px 0; color: #64748B; width: 140px;">Pillar Name:</td>
          <td style="padding: 4px 0; font-weight: 700;">${pillar_name}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Pillar ID:</td>
          <td style="padding: 4px 0; font-weight: 800; color: #FF7900; font-family: 'Courier New', Courier, monospace;">${pillar_id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Service:</td>
          <td style="padding: 4px 0; font-weight: 600;">${service_category}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Location:</td>
          <td style="padding: 4px 0; font-weight: 600;">${service_location}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Status:</td>
          <td style="padding: 4px 0; font-weight: 800; color: #10B981;">VERIFIED</td>
        </tr>
      </table>
    </div>

    <!-- Welcome Section -->
    <div style="font-size: 14px; font-weight: 800; color: #0B1220; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
      WELCOME TO THE COOP HUB FAMILY!
    </div>
    <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
      You can now access your Pillar Portal and start receiving service requests from customers.
    </p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px;">From your Pillar Portal you can:</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Receive customer service requests</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Accept or decline jobs</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Chat securely with customers</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Call customers without exposing phone numbers</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Share/track service location when required</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Update job status</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Confirm customer arrival using OTP</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Manage payments and earnings</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> View completed jobs and history</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Receive customer feedback and ratings</td></tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 28px 0;">
      <a href="${portal_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        ACCESS PILLAR PORTAL
      </a>
    </div>

    <!-- Important Pillar ID box -->
    <div style="background-color: #FEF3C7; border: 1px dashed #F59E0B; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px; color: #92400E; line-height: 1.5;">
      <strong>IMPORTANT</strong><br />
      Your Pillar ID is your unique identity on COOP HUB.<br />
      <div style="font-size: 18px; font-weight: 900; color: #B45309; margin: 6px 0; font-family: monospace;">
        Pillar ID: ${pillar_id}
      </div>
      If you did not register for a COOP HUB Pillar account, contact COOP HUB Support.
    </div>

    <div style="font-size: 15px; font-weight: 700; color: #0B1220; text-align: center;">
      Welcome to the family, ${pillar_name}! 🧡
    </div>
  `;

  return baseEmailWrapper({
    title: '🎉 Welcome to COOP HUB — Your Pillar Account Has Been Verified',
    portalBadge: 'Unified Service Platform',
    contentHtml
  });
}

// ============================================================================
// 4. PILLAR OTP LOGIN EMAIL
// ============================================================================
export function renderPillarOtpTemplate({ 
  pillar_name = 'Technician', 
  pillar_id = 'PIL-CHE-000', 
  otp = '------', 
  expiry_minutes = 10 
}) {
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${pillar_name}</strong>,
    </div>

    <h1 style="font-size: 22px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0;">
      Your COOP HUB Pillar Login Code
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
      Use the verification code below to securely sign in to your COOP HUB Pillar Portal.
    </p>

    <!-- OTP Display Box -->
    <div style="background-color: #050A12; border: 2px solid #FF7900; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; color: #FF7900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        YOUR LOGIN CODE
      </div>
      <div style="font-size: 36px; font-weight: 900; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
        ${otp}
      </div>
      <div style="font-size: 12px; color: #94A3B8; margin-top: 8px;">
        This code will expire in ${expiry_minutes} minutes.
      </div>
    </div>

    <!-- Security Notice -->
    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; color: #92400E; line-height: 1.5;">
      <strong>SECURITY NOTICE</strong><br />
      • Never share this OTP with anyone.<br />
      • COOP HUB will never ask you to share your login verification code.<br />
      • If you did not attempt to sign in, safely ignore this email.
    </div>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #334155;">
      <strong>PILLAR ID:</strong> <span style="font-family: monospace; font-weight: 700; color: #FF7900;">${pillar_id}</span>
    </div>

    <div style="font-size: 13px; color: #64748B;">
      Need help? <a href="#" style="color: #FF7900; font-weight: 700;">COOP HUB → Pillar Support</a>
    </div>
  `;

  return baseEmailWrapper({
    title: 'Your COOP HUB Pillar Login Code',
    portalBadge: 'Pillar Portal',
    contentHtml
  });
}

// ============================================================================
// 5. CUSTOMER SERVICE REQUEST CONFIRMATION EMAIL
// ============================================================================
export function renderServiceRequestConfirmationTemplate({
  customer_name = 'Customer',
  service_name = 'Home Service',
  request_id = 'REQ-0000',
  service_date = 'Today',
  service_time = 'Scheduled Time',
  service_location = 'Service Location',
  total_amount = '0',
  request_status = 'Confirmed',
  pillar_name = null,
  pillar_id = null,
  payment_status = null,
  invoice_number = null,
  request_url = '#'
}) {
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${customer_name}</strong>,
    </div>

    <h1 style="font-size: 22px; font-weight: 800; color: #0B1220; margin: 0 0 12px 0;">
      Your service request has been successfully confirmed.
    </h1>

    <!-- Summary Box -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px;">
        <span style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 10px; text-transform: uppercase;">
          SERVICE REQUEST CONFIRMED ✓
        </span>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #0B1220;">
        <tr>
          <td style="padding: 4px 0; color: #64748B; width: 140px;">Service:</td>
          <td style="padding: 4px 0; font-weight: 700;">${service_name}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Request ID:</td>
          <td style="padding: 4px 0; font-weight: 800; color: #FF7900; font-family: monospace;">${request_id}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Date:</td>
          <td style="padding: 4px 0; font-weight: 600;">${service_date}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Time:</td>
          <td style="padding: 4px 0; font-weight: 600;">${service_time}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Location:</td>
          <td style="padding: 4px 0; font-weight: 600;">${service_location}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Amount:</td>
          <td style="padding: 4px 0; font-weight: 800; font-size: 16px;">₹${total_amount}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748B;">Status:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #10B981; text-transform: capitalize;">${request_status}</td>
        </tr>
      </table>
    </div>

    ${pillar_name ? `
    <!-- Assigned Pillar Box -->
    <div style="background-color: #F8FAFC; border-left: 4px solid #FF7900; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; color: #FF7900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
        YOUR PILLAR
      </div>
      <div style="font-size: 16px; font-weight: 800; color: #0B1220;">
        ${pillar_name}
      </div>
      ${pillar_id ? `<div style="font-size: 12px; color: #64748B; font-family: monospace;">Pillar ID: ${pillar_id}</div>` : ''}
      <div style="font-size: 12px; color: #334155; margin-top: 6px;">
        You can communicate with your assigned Pillar through COOP HUB without exposing your personal phone number.
      </div>
    </div>
    ` : ''}

    <!-- CTA Button -->
    <div style="text-align: center; margin: 24px 0 28px 0;">
      <a href="${request_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        VIEW REQUEST
      </a>
    </div>

    <!-- What happens next section -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; color: #0B1220; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
        WHAT HAPPENS NEXT?
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #334155; line-height: 1.8;">
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Pillar accepts your request</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Secure chat/call becomes available</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Live location can be tracked when available</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Receive arrival notification</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Confirm Pillar arrival using OTP</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Service is completed</td></tr>
        <tr><td><span style="color: #10B981; font-weight: 800; margin-right: 8px;">✓</span> Optional feedback and rating</td></tr>
      </table>
    </div>

    ${(payment_status || invoice_number) ? `
    <!-- Payment & Invoice section (only when real data exists) -->
    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 13px; color: #64748B;">
      <strong style="color: #0B1220;">PAYMENT</strong><br />
      ${payment_status ? `Payment Status: <strong style="color: #0B1220; text-transform: capitalize;">${payment_status}</strong><br />` : ''}
      ${invoice_number ? `Invoice: <strong style="color: #0B1220; font-family: monospace;">${invoice_number}</strong>` : ''}
    </div>
    ` : ''}
  `;

  return baseEmailWrapper({
    title: 'COOP HUB — Your Service Request Has Been Confirmed',
    portalBadge: 'Customer Service Platform',
    contentHtml
  });
}

// ============================================================================
// 6. PILLAR REJECTION & RESUBMIT NOTIFICATION EMAIL
// ============================================================================
export function renderPillarRejectionTemplate({
  pillar_name = 'Technician',
  rejection_reason = 'Document details could not be verified.',
  resubmit_url = '#'
}) {
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Hi <strong style="color: #0B1220;">${pillar_name}</strong>,
    </div>

    <h1 style="font-size: 22px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0;">
      COOP HUB — Verification Update
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
      Your COOP HUB Pillar registration could not be approved at this time.
    </p>

    <!-- Rejection Reason Card -->
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 0 8px 8px 0; padding: 18px 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; color: #DC2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
        REASON FOR REJECTION
      </div>
      <div style="font-size: 15px; color: #991B1B; font-weight: 600; line-height: 1.5;">
        ${rejection_reason}
      </div>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      Please review the reason, correct the required information/document, and resubmit your verification.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 24px 0 28px 0;">
      <a href="${resubmit_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        REVIEW & RESUBMIT
      </a>
    </div>

    <div style="font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 16px;">
      Thank you,<br />
      <strong style="color: #0B1220;">COOP HUB Team</strong>
    </div>
  `;

  return baseEmailWrapper({
    title: 'COOP HUB — Verification Update',
    portalBadge: 'Pillar Verification Desk',
    contentHtml
  });
}

/**
 * 7. Insurance Claim Approval Email Template
 */
export function renderClaimApprovalTemplate({
  pillar_name = 'Technician',
  claim_id = 'CLM-0000',
  approved_amount = '0',
  claim_type = 'Health & Medical',
  decision_date = new Date().toLocaleDateString()
}) {
  const portal_url = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/welfare` : 'https://coophub.in/dashboard/welfare';
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Dear <strong style="color: #0B1220;">${pillar_name}</strong>,
    </div>

    <h1 style="font-size: 22px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0;">
      🎉 Insurance Claim Approved
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
      We are pleased to inform you that your insurance claim has been officially verified and approved by the COOP HUB Welfare Board.
    </p>

    <!-- Claim Approval Details Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; width: 40%;">Claim Reference ID</td>
        <td style="padding: 14px 20px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 800; color: #0B1220;">${claim_id}</td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">Claim Category</td>
        <td style="padding: 14px 20px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: 700; color: #0B1220;">${claim_type}</td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">Approved Payout Amount</td>
        <td style="padding: 14px 20px; border-bottom: 1px solid #E2E8F0; font-size: 16px; font-weight: 900; color: #10B981;">₹${Number(String(approved_amount).replace(/[^0-9.]/g, '') || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 14px 20px; font-size: 13px; color: #64748B;">Approval Date</td>
        <td style="padding: 14px 20px; font-size: 14px; font-weight: 700; color: #0B1220;">${decision_date}</td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      The approved settlement will be credited directly to your registered bank account per cooperative disbursement schedule. You can track this in your Pillar Welfare Dashboard.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 24px 0 28px 0;">
      <a href="${portal_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        VIEW WELFARE DASHBOARD
      </a>
    </div>

    <div style="font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 16px;">
      In solidarity,<br />
      <strong style="color: #0B1220;">COOP HUB Welfare & Insurance Committee</strong>
    </div>
  `;

  return baseEmailWrapper({
    title: 'COOP HUB — Insurance Claim Approved',
    portalBadge: 'Welfare & Insurance Services',
    contentHtml
  });
}

/**
 * 8. Insurance Claim Rejection Email Template
 */
export function renderClaimRejectionTemplate({
  pillar_name = 'Technician',
  claim_id = 'CLM-0000',
  claim_type = 'Health & Medical',
  decision_date = new Date().toLocaleDateString(),
  rejection_reason = 'Submitted medical bills or documentation did not meet policy coverage terms.'
}) {
  const portal_url = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/welfare` : 'https://coophub.in/dashboard/welfare';
  const contentHtml = `
    <div style="font-size: 16px; color: #64748B; margin-bottom: 6px;">
      Dear <strong style="color: #0B1220;">${pillar_name}</strong>,
    </div>

    <h1 style="font-size: 22px; font-weight: 800; color: #0B1220; margin: 0 0 16px 0;">
      ⚠️ Insurance Claim Update
    </h1>

    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
      Your insurance claim <strong>${claim_id}</strong> (${claim_type}) has been reviewed by the Welfare & Insurance Committee and could not be approved.
    </p>

    <!-- Rejection Reason Card -->
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 0 8px 8px 0; padding: 18px 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; color: #DC2626; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
        REASON FOR CLAIM REJECTION
      </div>
      <div style="font-size: 15px; color: #991B1B; font-weight: 600; line-height: 1.5;">
        ${rejection_reason}
      </div>
      <div style="font-size: 12px; color: #64748B; margin-top: 8px;">
        Decision Date: ${decision_date}
      </div>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
      If you have additional supporting invoices, discharge summaries, or believe this decision was made in error, you may open an administrative grievance or review your policy in the Welfare portal.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 24px 0 28px 0;">
      <a href="${portal_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 15px; font-weight: 700; border-radius: 8px; display: inline-block;">
        OPEN WELFARE PORTAL
      </a>
    </div>

    <div style="font-size: 13px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 16px;">
      Sincerely,<br />
      <strong style="color: #0B1220;">COOP HUB Welfare & Insurance Committee</strong>
    </div>
  `;

  return baseEmailWrapper({
    title: 'COOP HUB — Insurance Claim Update',
    portalBadge: 'Welfare & Insurance Services',
    contentHtml
  });
}

/**
 * 8. Customer Service Receipt & Tax Invoice Email Template
 * Dispatched to the customer's email upon service completion and payment settlement.
 */
export function renderServiceReceiptTemplate({
  customer_name = 'Customer',
  receipt_no = 'CH-2026-000123',
  booking_id = 'BK-2026-00456',
  invoice_no = 'INV-2026-00789',
  service_date = '02 Sep 2026',
  service_time = '11:30 AM',
  service_title = 'Electrical Repair',
  service_description = 'Ceiling fan capacitor replacement and wiring repair',
  service_location = 'Guindy, Chennai',
  pillar_name = 'Rajan K. (Verified Pillar)',
  pillar_id = 'PIL-4892',
  pillar_trade = 'Electrician',
  service_charge = '₹800.00',
  materials_parts = '₹250.00',
  additional_charges = '₹100.00',
  subtotal = '₹1,150.00',
  gst = '₹207.00',
  total_amount = '₹1,357.00',
  payment_method = 'UPI / Online',
  transaction_id = 'TXN000123',
  receipt_url = 'http://localhost:5173/receipt-template'
}) {
  const contentHtml = `
    <!-- Success Banner -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
        ✓ PAYMENT COMPLETED & SETTLED
      </div>
      <h2 style="font-size: 22px; font-weight: 900; color: #162238; margin: 12px 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        OFFICIAL SERVICE RECEIPT
      </h2>
      <p style="font-size: 13px; color: #64748B; margin: 0;">
        Thank you for choosing COOP HUB. Your service has been successfully completed.
      </p>
    </div>

    <!-- Receipt Meta Bar -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 12px 14px; border-right: 1px solid #E2E8F0; width: 25%;">
          <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Receipt No</span>
          <div style="font-size: 13px; font-weight: 800; color: #162238; margin-top: 2px;">${receipt_no}</div>
        </td>
        <td style="padding: 12px 14px; border-right: 1px solid #E2E8F0; width: 25%;">
          <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Booking ID</span>
          <div style="font-size: 13px; font-weight: 700; color: #FF7900; margin-top: 2px;">${booking_id}</div>
        </td>
        <td style="padding: 12px 14px; border-right: 1px solid #E2E8F0; width: 25%;">
          <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Date</span>
          <div style="font-size: 13px; font-weight: 600; color: #162238; margin-top: 2px;">${service_date}</div>
        </td>
        <td style="padding: 12px 14px; width: 25%;">
          <span style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Payment</span>
          <div style="font-size: 13px; font-weight: 700; color: #059669; margin-top: 2px;">✓ ${payment_method}</div>
        </td>
      </tr>
    </table>

    <!-- Service & Parties -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td width="48%" valign="top" style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #162238; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 8px;">
            Billed To (Customer)
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #162238;">${customer_name}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">${service_location}</div>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #162238; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 8px;">
            Serviced By (Pillar)
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #162238;">${pillar_name}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">${pillar_trade} • ID: ${pillar_id}</div>
        </td>
      </tr>
    </table>

    <!-- Itemized Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
      <tr style="background-color: #162238; color: #FFFFFF;">
        <th style="padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase;">Description</th>
        <th style="padding: 10px 14px; text-align: right; font-size: 11px; text-transform: uppercase;">Amount</th>
      </tr>
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 10px 14px; font-size: 13px; color: #162238;">
          <strong>${service_title}</strong>
          <div style="font-size: 11.5px; color: #64748B; margin-top: 2px;">${service_description}</div>
        </td>
        <td style="padding: 10px 14px; text-align: right; font-size: 13px; font-weight: 600; color: #162238;">${service_charge}</td>
      </tr>
      <tr style="border-bottom: 1px solid #F1F5F9; background-color: #FAFAFA;">
        <td style="padding: 8px 14px; font-size: 12.5px; color: #475569;">Materials / Replacement Parts</td>
        <td style="padding: 8px 14px; text-align: right; font-size: 12.5px; font-weight: 600; color: #162238;">${materials_parts}</td>
      </tr>
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 8px 14px; font-size: 12.5px; color: #475569;">Additional Service Charges</td>
        <td style="padding: 8px 14px; text-align: right; font-size: 12.5px; font-weight: 600; color: #162238;">${additional_charges}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
        <td style="padding: 8px 14px; font-size: 12.5px; color: #64748B;">Subtotal</td>
        <td style="padding: 8px 14px; text-align: right; font-size: 12.5px; font-weight: 600; color: #162238;">${subtotal}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: #F8FAFC;">
        <td style="padding: 8px 14px; font-size: 12.5px; color: #64748B;">GST (Tax)</td>
        <td style="padding: 8px 14px; text-align: right; font-size: 12.5px; font-weight: 600; color: #162238;">${gst}</td>
      </tr>
      <tr style="background-color: #162238; color: #FFFFFF;">
        <td style="padding: 12px 14px; font-size: 14px; font-weight: 800; text-transform: uppercase;">TOTAL PAID</td>
        <td style="padding: 12px 14px; text-align: right; font-size: 18px; font-weight: 900; color: #FF7900;">${total_amount}</td>
      </tr>
    </table>

    <!-- Cooperative Guarantee Note -->
    <div style="background-color: #F8FAFC; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 12px; color: #475569; line-height: 1.5;">
      <strong style="color: #059669;">Cooperative Guarantee:</strong> Every service booked through COOP HUB is fully insured and guarantees fair wages. 8.5% cooperative contribution directly funds technician health & accident cover.
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 24px 0 28px 0;">
      <a href="${receipt_url}" class="btn-primary" style="background-color: #FF7900; color: #FFFFFF; text-decoration: none; padding: 14px 36px; font-size: 14px; font-weight: 700; border-radius: 8px; display: inline-block; letter-spacing: 0.5px;">
        VIEW OFFICIAL RECEIPT ONLINE
      </a>
    </div>

    <div style="font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: center;">
      COOP HUB Multi-Purpose Service Cooperative Society<br />
      Reg. No: TN/COOP/2026/8942 • GSTIN: 33AAATC8942K1Z5<br />
      Need help? Contact support@coophub.in or call 1800-425-COOP
    </div>
  `;

  return baseEmailWrapper({
    title: 'COOP HUB — Official Service Receipt & Tax Invoice',
    portalBadge: 'Service Receipt & Billing',
    contentHtml
  });
}


