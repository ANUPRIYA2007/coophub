import sharp from 'sharp';

async function testNegative() {
  // A blurry blank gray box with no text
  const svg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#999999"/></svg>`;
  const imgBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const base64Data = 'data:image/png;base64,' + imgBuffer.toString('base64');

  console.log('Sending blank/unreadable image to http://localhost:5000/api/ai/process-document ...');
  const res = await fetch('http://localhost:5000/api/ai/process-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document: base64Data,
      documentCategory: 'identity',
      expectedDocumentType: 'aadhaar'
    })
  });

  const data = await res.json();
  console.log('\n--- Server Response Status ---:', res.status);
  console.log('Success flag (expected false):', data.success);
  console.log('Failure stage:', data.stage);
  console.log('Error message:', data.error);
}

testNegative().catch(err => {
  console.error('Negative test error:', err.message);
  process.exit(1);
});
