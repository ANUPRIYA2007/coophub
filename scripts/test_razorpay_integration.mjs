// Quick verification script for Razorpay integration
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log('============================================');
console.log('RAZORPAY INTEGRATION VERIFICATION');
console.log('============================================');

if (!KEY_ID || !KEY_SECRET) {
  console.error('❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env');
  process.exit(1);
}

console.log(`KEY_ID: ${KEY_ID.slice(0, 12)}...`);
console.log(`KEY_SECRET: ${KEY_SECRET.slice(0, 8)}...`);
console.log('');

const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

// Test 1: Create an order
console.log('TEST 1: Creating Razorpay order (₹5.00 = 500 paise)...');
try {
  const order = await razorpay.orders.create({
    amount: 500,
    currency: 'INR',
    receipt: `test_rcpt_${Date.now()}`
  });
  console.log(`✅ Order created successfully!`);
  console.log(`   Order ID: ${order.id}`);
  console.log(`   Amount:   ₹${(order.amount / 100).toFixed(2)}`);
  console.log(`   Currency: ${order.currency}`);
  console.log(`   Status:   ${order.status}`);
  console.log('');

  // Test 2: Verify HMAC signature generation works
  console.log('TEST 2: HMAC SHA256 signature generation...');
  const testPaymentId = 'pay_test123456';
  const body = order.id + '|' + testPaymentId;
  const sig = crypto.createHmac('sha256', KEY_SECRET).update(body).digest('hex');
  console.log(`✅ Signature generated: ${sig.slice(0, 20)}...`);
  console.log('');

  // Test 3: Fetch order status
  console.log('TEST 3: Fetching order status...');
  const fetched = await razorpay.orders.fetch(order.id);
  console.log(`✅ Order status: ${fetched.status}`);
  console.log('');

  console.log('============================================');
  console.log('ALL TESTS PASSED ✅');
  console.log('============================================');
} catch (err) {
  console.error('❌ Test failed:', err.message);
  if (err.statusCode) {
    console.error(`   HTTP Status: ${err.statusCode}`);
    console.error(`   Error body:`, err.error);
  }
  process.exit(1);
}
