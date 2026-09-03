import sharp from 'sharp';

async function testEndpoint() {
  const svg = `
    <svg width="600" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <text x="30" y="60" font-size="24" font-family="Arial" fill="black">GOVERNMENT OF INDIA</text>
      <text x="30" y="110" font-size="20" font-family="Arial" fill="black">RAMESH KUMAR</text>
      <text x="30" y="150" font-size="18" font-family="Arial" fill="black">DOB: 15/08/1988</text>
      <text x="30" y="190" font-size="18" font-family="Arial" fill="black">MALE</text>
      <text x="30" y="240" font-size="22" font-family="Arial" fill="black">9876 5432 1098</text>
    </svg>
  `;
  const imgBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const base64Data = 'data:image/png;base64,' + imgBuffer.toString('base64');

  console.log('Sending document to http://localhost:5000/api/ai/process-document ...');
  const res = await fetch('http://localhost:5000/api/ai/process-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document: base64Data,
      documentCategory: 'identity',
      expectedDocumentType: 'aadhaar',
      pillarProfile: {
        id: 'test-pillar-id',
        full_name: 'Ramesh Kumar',
        dob: '1988-08-15',
        mobile: '9876543210'
      }
    })
  });

  const data = await res.json();
  console.log('\n--- Server Response Status ---:', res.status);
  console.log('Success:', data.success);
  console.log('Detected Type:', data.documentType);
  console.log('OCR Confidence:', data.ocr?.confidence);
  console.log('OCR Clean Text:\n' + data.ocr?.cleanText);
  console.log('\nExtracted Fields:', data.fields);
  console.log('\nValidation:', data.validation);
}

testEndpoint().catch(err => {
  console.error('Endpoint test error:', err.message);
  process.exit(1);
});
