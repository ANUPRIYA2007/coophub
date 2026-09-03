import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

async function test() {
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
  console.log('Sample document image generated:', imgBuffer.length, 'bytes');

  // Test Sharp preprocessing
  let pipeline = sharp(imgBuffer).grayscale().normalize().sharpen();
  const processed = await pipeline.png().toBuffer();
  console.log('Sharp preprocessed image:', processed.length, 'bytes');

  // Test Tesseract recognition
  const worker = await createWorker('eng');
  const ret = await worker.recognize(processed);
  console.log('\n--- OCR Extracted Text ---');
  console.log(ret.data.text.trim());
  console.log('--- End Text ---');
  console.log('Confidence:', ret.data.confidence.toFixed(1) + '%');
  await worker.terminate();
}

test().then(() => {
  console.log('\nSUCCESS: Sharp + Tesseract pipeline verified successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
