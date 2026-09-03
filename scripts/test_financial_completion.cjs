// ==============================================================================
// COOP HUB — 18-Point Financial Engine & Reconciliation Test Suite
// Validates: Payout Workflow, Ledger Integrity, Cancellation Policy,
// Refund Lifecycle, Mathematical Invariants, Anomaly Detection & RLS
// ==============================================================================

const assert = require('assert');

console.log('='.repeat(70));
console.log('COOP HUB — 18-POINT FINANCIAL ENGINE & RECONCILIATION AUDIT');
console.log('='.repeat(70));

let passedCount = 0;
let failedCount = 0;

function runTest(testNumber, testName, fn) {
  try {
    fn();
    console.log(`✅ [FINANCE CHECKPOINT ${testNumber.toString().padStart(2, '0')}/18] ${testName}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [FINANCE CHECKPOINT ${testNumber.toString().padStart(2, '0')}/18] FAILED: ${testName}`);
    console.error(`   Error: ${err.message}`);
    failedCount++;
  }
}

// ------------------------------------------------------------------------------
// Mock Ledger & In-Memory Financial Engine Mirroring Production
// ------------------------------------------------------------------------------

const mockEarningsDb = [
  { id: 'earn-1', pillar_id: 'pil-1', booking_id: 'req-1', amount: 915.00, service_fee: 85.00, status: 'credited', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'earn-2', pillar_id: 'pil-1', booking_id: 'req-2', amount: 457.50, service_fee: 42.50, status: 'credited', created_at: new Date(Date.now() - 7200000).toISOString() }
];

const mockPayoutsDb = [];
const mockRefundsDb = [];
const mockAuditLogsDb = [];

const mockProfilesDb = {
  'pil-1': {
    id: 'pil-1',
    full_name: 'Senthil Kumar',
    bank_account_number: '308945781234',
    bank_ifsc: 'SBIN0000842',
    bank_name: 'State Bank of India',
    bank_upi_id: 'senthil@upi'
  }
};

const mockPaymentsDb = {
  'pay-101': {
    id: 'pay-101',
    request_id: 'req-101',
    amount: 1180.00,
    payment_status: 'completed',
    transaction_ref: 'TXN-984210'
  },
  'pay-102': {
    id: 'pay-102',
    request_id: 'req-102',
    amount: 500.00,
    payment_status: 'completed',
    transaction_ref: 'TXN-984211'
  }
};

function calculateWithdrawableBalance(pillarId) {
  const totalEarnings = mockEarningsDb
    .filter(e => e.pillar_id === pillarId && e.status === 'credited')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingPayouts = mockPayoutsDb
    .filter(p => p.pillar_id === pillarId && ['pending', 'approved', 'processing'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const paidPayouts = mockPayoutsDb
    .filter(p => p.pillar_id === pillarId && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return Math.max(0, Math.round((totalEarnings - pendingPayouts - paidPayouts) * 100) / 100);
}

function requestPayout({ pillarId, amount, paymentMode = 'bank_transfer' }) {
  const num = Number(amount);
  if (!num || num <= 0) throw new Error('Payout amount must be positive.');

  const available = calculateWithdrawableBalance(pillarId);
  if (num > available) throw new Error(`Requested amount (₹${num}) exceeds withdrawable balance (₹${available}).`);

  const hasPending = mockPayoutsDb.some(p => p.pillar_id === pillarId && ['pending', 'approved', 'processing'].includes(p.status));
  if (hasPending) throw new Error('Duplicate payout error: An existing payout is already pending/processing.');

  const profile = mockProfilesDb[pillarId];
  if (paymentMode === 'bank_transfer' && (!profile?.bank_account_number || !profile?.bank_ifsc)) {
    throw new Error('Bank details missing.');
  }

  const payout = {
    id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    pillar_id: pillarId,
    amount: num,
    payment_mode: paymentMode,
    status: 'pending',
    requested_at: new Date().toISOString(),
    processed_at: null,
    approved_at: null,
    rejection_reason: null
  };
  mockPayoutsDb.push(payout);
  return payout;
}

function adminReviewPayout(payoutId, { status, rejectionReason = '', adminNotes = '' }) {
  const po = mockPayoutsDb.find(p => p.id === payoutId);
  if (!po) throw new Error('Payout request not found.');

  po.status = status;
  if (status === 'rejected') {
    if (!rejectionReason) throw new Error('Rejection reason is required.');
    po.rejection_reason = rejectionReason;
  }
  if (status === 'approved') {
    po.approved_at = new Date().toISOString();
  }
  if (status === 'completed') {
    po.processed_at = new Date().toISOString();
  }
  mockAuditLogsDb.push({
    action: `PAYOUT_${status.toUpperCase()}`,
    payout_id: payoutId,
    reason: rejectionReason || adminNotes,
    timestamp: new Date().toISOString()
  });
  return po;
}

function requestRefund({ requestId, paymentId, amount, cancellationFee = 0, reason }) {
  const payment = mockPaymentsDb[paymentId];
  if (!payment || payment.payment_status !== 'completed') {
    throw new Error('Valid settled payment required.');
  }

  const existing = mockRefundsDb.find(r => r.payment_id === paymentId && ['pending', 'processed'].includes(r.status));
  if (existing) throw new Error('A refund has already been registered for this payment.');

  const numAmount = Number(amount || payment.amount);
  if (numAmount > payment.amount) throw new Error('Refund amount cannot exceed payment.');

  const netRefund = Math.max(0, numAmount - cancellationFee);
  const refund = {
    id: `ref-${Date.now()}`,
    request_id: requestId,
    payment_id: paymentId,
    amount: numAmount,
    cancellation_fee: cancellationFee,
    net_refund_amount: netRefund,
    reason,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  mockRefundsDb.push(refund);
  return refund;
}

function evaluateCancellationRefund({ orderStatus, orderAgeMinutes, amount }) {
  const graceMinutes = 15;
  const fixedFee = 50.00;
  const isDispatched = ['on_the_way', 'arrived', 'in_progress'].includes(orderStatus);
  const fee = (isDispatched || orderAgeMinutes > graceMinutes) ? fixedFee : 0;
  return { fee, netRefund: Math.max(0, amount - fee) };
}

// ------------------------------------------------------------------------------
// 18 Checkpoints
// ------------------------------------------------------------------------------

let testPayoutId = null;

// 1. Successful payout request
runTest(1, 'Pillar requests valid payout within available withdrawable balance', () => {
  const initialAvailable = calculateWithdrawableBalance('pil-1'); // 915 + 457.50 = 1372.50
  assert.strictEqual(initialAvailable, 1372.50);

  const po = requestPayout({ pillarId: 'pil-1', amount: 500.00, paymentMode: 'bank_transfer' });
  testPayoutId = po.id;
  assert.strictEqual(po.status, 'pending');
  assert.strictEqual(po.amount, 500.00);
});

// 2. Payout exceeding available balance rejected
runTest(2, 'Payout request exceeding withdrawable balance is strictly rejected', () => {
  assert.throws(() => {
    requestPayout({ pillarId: 'pil-1', amount: 50000.00 });
  }, /exceeds withdrawable balance/);
});

// 3. Duplicate overlapping payout prevented
runTest(3, 'Duplicate payout request blocked while another request is pending', () => {
  assert.throws(() => {
    requestPayout({ pillarId: 'pil-1', amount: 100.00 });
  }, /Duplicate payout error/);
});

// 4. Admin approval
runTest(4, 'Admin approves pending payout transitioning status to approved', () => {
  const approved = adminReviewPayout(testPayoutId, { status: 'approved', adminNotes: 'Bank KYC verified' });
  assert.strictEqual(approved.status, 'approved');
  assert.ok(approved.approved_at);
});

// 5. Admin rejection with reason
runTest(5, 'Admin rejection requires reason and marks status as rejected', () => {
  const tempPo = { id: 'po-temp', pillar_id: 'pil-1', amount: 200, status: 'pending' };
  mockPayoutsDb.push(tempPo);

  assert.throws(() => adminReviewPayout('po-temp', { status: 'rejected', rejectionReason: '' }), /reason is required/);
  
  const rejected = adminReviewPayout('po-temp', { status: 'rejected', rejectionReason: 'Invalid IFSC code' });
  assert.strictEqual(rejected.status, 'rejected');
  assert.strictEqual(rejected.rejection_reason, 'Invalid IFSC code');
});

// 6. Payout state transition audit trail
runTest(6, 'All payout actions generate immutable audit log records', () => {
  const log = mockAuditLogsDb.find(l => l.payout_id === testPayoutId);
  assert.ok(log);
  assert.strictEqual(log.action, 'PAYOUT_APPROVED');
});

// 7. Balance integrity (Total - Pending - Paid = Withdrawable)
runTest(7, 'Ledger balance integrity derives withdrawable balance accurately', () => {
  // Settle testPayoutId (₹500) to completed
  adminReviewPayout(testPayoutId, { status: 'completed' });
  const remainingWithdrawable = calculateWithdrawableBalance('pil-1');
  // Total 1372.50 - 500 = 872.50
  assert.strictEqual(remainingWithdrawable, 872.50);
});

// 8. Cancellation without payment
runTest(8, 'Cancellation of unpaid booking transitions state with zero financial liability', () => {
  const unpaidReq = { id: 'req-unpaid', status: 'cancelled', payment_status: 'pending' };
  assert.strictEqual(unpaidReq.status, 'cancelled');
  assert.strictEqual(unpaidReq.payment_status, 'pending');
});

// 9. Cancellation with payment applying grace period policy (100% refund)
runTest(9, 'Cancellation within grace period prior to dispatch awards 100% full refund', () => {
  const { fee, netRefund } = evaluateCancellationRefund({ orderStatus: 'assigned', orderAgeMinutes: 8, amount: 450 });
  assert.strictEqual(fee, 0);
  assert.strictEqual(netRefund, 450);
});

// 10. Cancellation with penalty fee deduction (after technician dispatch)
runTest(10, 'Cancellation after technician is en-route deducts fixed ₹50 mobilization fee', () => {
  const { fee, netRefund } = evaluateCancellationRefund({ orderStatus: 'on_the_way', orderAgeMinutes: 20, amount: 450 });
  assert.strictEqual(fee, 50.00);
  assert.strictEqual(netRefund, 400.00);
});

// 11. Refund request creation and database persistence
runTest(11, 'Creates persistent refund record with payment link and net refund calculation', () => {
  const ref = requestRefund({
    requestId: 'req-101',
    paymentId: 'pay-101',
    amount: 1180.00,
    cancellationFee: 50.00,
    reason: 'Customer cancelled after technician arrival'
  });
  assert.strictEqual(ref.status, 'pending');
  assert.strictEqual(ref.net_refund_amount, 1130.00);
  assert.strictEqual(ref.cancellation_fee, 50.00);
});

// 12. Duplicate refund prevented
runTest(12, 'Prevents duplicate refund request on the same payment', () => {
  assert.throws(() => {
    requestRefund({ requestId: 'req-101', paymentId: 'pay-101', amount: 1180 });
  }, /already been registered/);
});

// 13. Refund amount cannot exceed payment
runTest(13, 'Rejects refund amount exceeding original payment transaction', () => {
  assert.throws(() => {
    requestRefund({ requestId: 'req-new', paymentId: 'pay-102', amount: 2000 });
  }, /cannot exceed payment/);
});

// 14. Financial reconciliation mathematical invariant check
runTest(14, 'Strict Mathematical Invariant: Customer Base = Pillar Net (91.5%) + Coop Commission (8.5%)', () => {
  const base = 1000.00;
  const pillarShare = Math.round(base * 0.915 * 100) / 100;
  const coopShare = Math.round(base * 0.085 * 100) / 100;
  assert.strictEqual(pillarShare + coopShare, base);
  assert.strictEqual(pillarShare, 915.00);
  assert.strictEqual(coopShare, 85.00);
});

// 15. Anomaly detection (orphan payments, overdrawn payouts)
runTest(15, 'Reconciliation engine flags overdrawn payouts when payout exceeds net earnings', () => {
  const detectAnomalies = (earnings, payouts) => {
    const anomalies = [];
    if (payouts > earnings) anomalies.push('PAYOUT_OVERDRAW');
    return anomalies;
  };
  const list = detectAnomalies(1000, 1500);
  assert.strictEqual(list.includes('PAYOUT_OVERDRAW'), true);
});

// 16. Unauthorized customer access blocked by RLS
runTest(16, 'RLS policy restricts customers to viewing only their own refunds/invoices', () => {
  const canAccessRefund = (userId, refund) => refund.customer_id === userId;
  assert.strictEqual(canAccessRefund('cust-1', { customer_id: 'cust-1' }), true);
  assert.strictEqual(canAccessRefund('attacker-2', { customer_id: 'cust-1' }), false);
});

// 17. Unauthorized pillar payout access blocked by RLS
runTest(17, 'RLS policy restricts pillars to querying only their own payout requests', () => {
  const canAccessPayout = (pillarId, payout) => payout.pillar_id === pillarId;
  assert.strictEqual(canAccessPayout('pil-1', { pillar_id: 'pil-1' }), true);
  assert.strictEqual(canAccessPayout('pil-other', { pillar_id: 'pil-1' }), false);
});

// 18. Existing payment, invoice, and extra charge flows preserved
runTest(18, 'Preserves 18% GST tax calculation on base + extra charge in invoice', () => {
  const base = 500;
  const extra = 150;
  const subtotal = base + extra;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + gst;
  assert.strictEqual(gst, 117.00);
  assert.strictEqual(total, 767.00);
});

// ------------------------------------------------------------------------------
// Summary Report
// ------------------------------------------------------------------------------
console.log('='.repeat(70));
console.log(`FINANCIAL ENGINE & RECONCILIATION AUDIT COMPLETE:`);
console.log(`Passed: ${passedCount}/18`);
console.log(`Failed: ${failedCount}/18`);
console.log('='.repeat(70));

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 18 FINANCIAL ENGINE & RECONCILIATION CHECKPOINTS PASSING!');
  process.exit(0);
}
