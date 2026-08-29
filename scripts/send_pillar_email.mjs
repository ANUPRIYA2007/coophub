import https from 'https';

const recipientEmail = "anupriyarajaraman07@gmail.com";
const pillarId = "PIL-CHE-044";
const pillarName = "Leo";
const trade = "Plumber";
const serviceArea = "Guindy (600032), Chennai";

const emailSubject = `🎉 Official COOP HUB Activation: Unique Pillar ID ${pillarId} Approved`;
const emailBody = `
======================================================================
COOP HUB — OFFICIAL PILLAR REGISTRATION & APPROVAL CONFIRMATION
======================================================================

Dear ${pillarName},

Congratulations! Your Pillar Technician application has been reviewed, approved, and activated by the Cooperative Administration.

----------------------------------------------------------------------
YOUR OFFICIAL MEMBERSHIP & ACCESS CREDENTIALS
----------------------------------------------------------------------
• Unique Pillar ID   : ${pillarId}
• Registered Name    : ${pillarName}
• Registered Email   : ${recipientEmail}
• Certified Trade    : ${trade}
• Operating Zone     : ${serviceArea}
• Membership Status  : VERIFIED & ACTIVE
----------------------------------------------------------------------

HOW TO ACCESS YOUR PILLAR DASHBOARD:
1. Open the Cooperative Portal: http://localhost:5173/pillar/login
2. Sign in with your assigned Pillar ID (${pillarId}) or your email (${recipientEmail})
3. Enter your password to view incoming customer requests, live radar tracking, and lifetime earnings.

For assistance, reach out to your Cooperative District Desk at support@coophub.in

Warm regards,
Administrative Verification Division
COOP HUB Cooperative Society Ltd.
======================================================================
`;

console.log("Preparing email delivery to:", recipientEmail);
console.log(emailBody);

// Attempt transmission via public Web3Forms relay
async function sendViaWeb3Forms() {
  const postData = JSON.stringify({
    access_key: "01f66d48-cb58-4560-bf8f-88e2c3426e2e", // Standard public delivery key
    subject: emailSubject,
    from_name: "COOP HUB Cooperative",
    email: recipientEmail,
    message: emailBody
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "api.web3forms.com",
      path: "/submit",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ success: false, raw: data });
        }
      });
    });

    req.on("error", (err) => resolve({ success: false, error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function main() {
  const res = await sendViaWeb3Forms();
  console.log("Transmission Response:", res);
}

main();
