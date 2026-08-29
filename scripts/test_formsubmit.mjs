import https from 'https';

const recipientEmail = "anupriyarajaraman07@gmail.com";
const pillarId = "PIL-CHE-044";
const pillarName = "Leo";

async function sendViaFormSubmit() {
  const postData = JSON.stringify({
    _subject: `🎉 COOP HUB Activation: Unique Pillar ID ${pillarId} Approved`,
    _template: "table",
    _captcha: "false",
    name: pillarName,
    email: recipientEmail,
    Pillar_ID: pillarId,
    Certified_Trade: "Plumber",
    Status: "Verified & Active",
    Portal_Login_URL: "http://localhost:5173/pillar/login",
    Message: `Dear ${pillarName}, your Pillar membership is approved! Your Unique Pillar ID is ${pillarId}. You can now sign in to your dashboard.`
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "formsubmit.co",
      path: `/ajax/${recipientEmail}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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

sendViaFormSubmit().then(res => console.log("FormSubmit result:", res));
