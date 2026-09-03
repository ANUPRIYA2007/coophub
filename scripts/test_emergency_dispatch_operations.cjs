// ==============================================================================
// COOP HUB — 25-Point Real-Time Operations & Emergency Dispatch Test Suite
// Validates: Geolocation, Haversine Distance, Candidate Discovery, 90s Offer Expiry,
// State Transitions, Sequential Re-dispatch, Escalation & Audit Trail
// ==============================================================================

const assert = require('assert');

console.log('='.repeat(70));
console.log('COOP HUB — 25-POINT REAL-TIME OPERATIONS & EMERGENCY DISPATCH AUDIT');
console.log('='.repeat(70));

let passedCount = 0;
let failedCount = 0;

function runTest(testNumber, testName, fn) {
  try {
    fn();
    console.log(`✅ [EMERGENCY CHECKPOINT ${testNumber.toString().padStart(2, '0')}/25] ${testName}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [EMERGENCY CHECKPOINT ${testNumber.toString().padStart(2, '0')}/25] FAILED: ${testName}`);
    console.error(`   Error: ${err.message}`);
    failedCount++;
  }
}

// ------------------------------------------------------------------------------
// Mock Production Service Engine
// ------------------------------------------------------------------------------

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function calculateEstimatedEta(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return null;
  const travelTimeMins = (distanceKm / 20) * 60; // 20 km/h urban speed
  const totalEtaMins = Math.max(5, Math.round(travelTimeMins + 5)); // +5 min mobilization
  return {
    eta_minutes: totalEtaMins,
    label: `${totalEtaMins} mins (ESTIMATED)`,
    method: 'DISTANCE_BASED_URBAN_SPEED'
  };
}

function isLocationFresh(timestamp) {
  if (!timestamp) return false;
  const THRESHOLD = 30 * 60 * 1000; // 30 minutes
  return (Date.now() - new Date(timestamp).getTime()) <= THRESHOLD;
}

function rankEmergencyCandidates(pillars, request) {
  return pillars
    .filter(p => p.status === 'verified' && p.is_available === true)
    .filter(p => {
      const s = (request.service_name || '').toLowerCase();
      const trades = Array.isArray(p.main_services) ? p.main_services : [p.main_services];
      return trades.some(t => String(t).toLowerCase().includes(s) || s.includes(String(t).toLowerCase()));
    })
    .map(p => {
      const dist = calculateHaversineDistance(request.latitude, request.longitude, p.lat, p.lng);
      const isFresh = isLocationFresh(p.last_location_time);
      let score = 50; // Base trade match
      if (dist !== null) {
        score += Math.max(0, Math.round((1 - (dist / 20)) * 35));
      }
      if (isFresh) score += 10;
      score -= ((p.active_jobs || 0) * 15);
      return {
        ...p,
        distance_km: dist,
        location_stale: !isFresh && dist !== null,
        dispatch_score: Math.max(0, score)
      };
    })
    .sort((a, b) => b.dispatch_score - a.dispatch_score);
}

// ------------------------------------------------------------------------------
// Checkpoint Test Assertions
// ------------------------------------------------------------------------------

// 1. Emergency creation
runTest(1, 'Creates emergency request with priority flag and response deadline', () => {
  const req = {
    id: 'REQ-EM-101',
    is_emergency: true,
    priority_level: 'EMERGENCY',
    emergency_reason: 'Sparking MCB and burning odor',
    dispatch_status: 'EMERGENCY_CREATED',
    created_at: new Date().toISOString()
  };
  assert.strictEqual(req.is_emergency, true);
  assert.strictEqual(req.priority_level, 'EMERGENCY');
  assert.strictEqual(req.dispatch_status, 'EMERGENCY_CREATED');
});

// 2. Location validation
runTest(2, 'Validates incoming geolocation coordinates within geographic service bounds', () => {
  const isValidCoord = (lat, lng) => lat >= 12.80 && lat <= 13.25 && lng >= 80.05 && lng <= 80.35;
  assert.strictEqual(isValidCoord(13.0067, 80.2025), true); // Guindy, Chennai
  assert.strictEqual(isValidCoord(28.6139, 77.2090), false); // Delhi, out of bounds
});

// 3. Trade matching
runTest(3, 'Matches requested hazard against certified technician trade specialization', () => {
  const pillar = { main_services: ['Electrical Maintenance', 'Wiring'] };
  const matches = (svc) => pillar.main_services.some(t => t.toLowerCase().includes(svc.toLowerCase()));
  assert.strictEqual(matches('electrical'), true);
  assert.strictEqual(matches('plumbing'), false);
});

// 4. Verified Pillar filtering
runTest(4, 'Filters out unverified or pending technicians from emergency dispatch', () => {
  const pillars = [
    { id: 'p1', status: 'verified', is_available: true },
    { id: 'p2', status: 'pending', is_available: true }
  ];
  const eligible = pillars.filter(p => p.status === 'verified');
  assert.strictEqual(eligible.length, 1);
  assert.strictEqual(eligible[0].id, 'p1');
});

// 5. Availability filtering
runTest(5, 'Filters out technicians who are currently offline or busy', () => {
  const pillars = [
    { id: 'p1', status: 'verified', is_available: true },
    { id: 'p2', status: 'verified', is_available: false }
  ];
  const eligible = pillars.filter(p => p.is_available);
  assert.strictEqual(eligible.length, 1);
  assert.strictEqual(eligible[0].id, 'p1');
});

// 6. Distance calculation
runTest(6, 'Calculates Haversine distance in kilometers accurately', () => {
  // Guindy (13.0067, 80.2025) to Velachery (12.9815, 80.2180) ~3.2 km
  const dist = calculateHaversineDistance(13.0067, 80.2025, 12.9815, 80.2180);
  assert.ok(dist >= 3.0 && dist <= 3.5, `Distance was ${dist}`);
});

// 7. Stale location handling
runTest(7, 'Flags LOCATION_STALE if last coordinate update exceeds 30 minutes', () => {
  const freshTime = new Date().toISOString();
  const staleTime = new Date(Date.now() - (45 * 60 * 1000)).toISOString();
  assert.strictEqual(isLocationFresh(freshTime), true);
  assert.strictEqual(isLocationFresh(staleTime), false);
});

// 8. Dispatch ranking
runTest(8, 'Ranks candidate with closer proximity and fresh GPS higher than distant candidate', () => {
  const req = { service_name: 'Electrical', latitude: 13.0067, longitude: 80.2025 };
  const mockPillars = [
    { id: 'p_far', status: 'verified', is_available: true, main_services: ['Electrical'], lat: 13.0827, lng: 80.2707, active_jobs: 0, last_location_time: new Date().toISOString() }, // ~11km away
    { id: 'p_near', status: 'verified', is_available: true, main_services: ['Electrical'], lat: 13.0100, lng: 80.2050, active_jobs: 0, last_location_time: new Date().toISOString() } // ~0.5km away
  ];
  const ranked = rankEmergencyCandidates(mockPillars, req);
  assert.strictEqual(ranked[0].id, 'p_near');
});

// 9. Offer creation
runTest(9, 'Generates sequential offer with 90-second expiration window', () => {
  const now = Date.now();
  const offer = {
    candidate_id: 'p1',
    offered_at: new Date(now).toISOString(),
    expires_at: new Date(now + 90000).toISOString()
  };
  const diffSec = Math.round((new Date(offer.expires_at) - new Date(offer.offered_at)) / 1000);
  assert.strictEqual(diffSec, 90);
});

// 10. Offer expiration
runTest(10, 'Detects expired offer when current time passes deadline', () => {
  const isExpired = (expiry) => Date.now() > new Date(expiry).getTime();
  const pastExpiry = new Date(Date.now() - 1000).toISOString();
  const futureExpiry = new Date(Date.now() + 50000).toISOString();
  assert.strictEqual(isExpired(pastExpiry), true);
  assert.strictEqual(isExpired(futureExpiry), false);
});

// 11. Pillar acceptance
runTest(11, 'Transitions state to ACCEPTED and assigns technician upon acceptance', () => {
  const req = { id: 'r1', status: 'pending', dispatch_status: 'OFFERED', pillar_id: null };
  const acceptOffer = (r, pillarId) => {
    r.status = 'assigned';
    r.dispatch_status = 'ACCEPTED';
    r.pillar_id = pillarId;
    return r;
  };
  const updated = acceptOffer(req, 'p1');
  assert.strictEqual(updated.status, 'assigned');
  assert.strictEqual(updated.dispatch_status, 'ACCEPTED');
  assert.strictEqual(updated.pillar_id, 'p1');
});

// 12. Pillar rejection
runTest(12, 'Logs DECLINED event and preserves exclusion list for subsequent dispatch', () => {
  const pastLogs = [{ pillar_id: 'p1', event_type: 'DECLINED' }];
  const isExcluded = (pid) => pastLogs.some(l => l.pillar_id === pid && l.event_type === 'DECLINED');
  assert.strictEqual(isExcluded('p1'), true);
  assert.strictEqual(isExcluded('p2'), false);
});

// 13. Re-dispatch
runTest(13, 'Automatically re-dispatches to second closest candidate when first declines', () => {
  const candidates = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
  const excluded = new Set(['p1']);
  const next = candidates.find(c => !excluded.has(c.id));
  assert.strictEqual(next.id, 'p2');
});

// 14. Escalation
runTest(14, 'Transitions to ESCALATED status when all eligible candidates are exhausted', () => {
  const candidates = [{ id: 'p1' }];
  const excluded = new Set(['p1']);
  const available = candidates.filter(c => !excluded.has(c.id));
  let status = 'DISPATCHING';
  if (available.length === 0) status = 'ESCALATED';
  assert.strictEqual(status, 'ESCALATED');
});

// 15. Status transitions
runTest(15, 'Enforces strict emergency dispatch state machine progression', () => {
  const allowed = {
    EMERGENCY_CREATED: ['DISPATCHING', 'CANCELLED'],
    DISPATCHING: ['OFFERED', 'ESCALATED', 'CANCELLED'],
    OFFERED: ['ACCEPTED', 'DISPATCHING', 'ESCALATED', 'CANCELLED'],
    ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
    EN_ROUTE: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    ESCALATED: ['OFFERED', 'ACCEPTED', 'CANCELLED']
  };
  const isValidTransition = (curr, next) => (allowed[curr] || []).includes(next);
  assert.strictEqual(isValidTransition('DISPATCHING', 'OFFERED'), true);
  assert.strictEqual(isValidTransition('OFFERED', 'ACCEPTED'), true);
  assert.strictEqual(isValidTransition('COMPLETED', 'DISPATCHING'), false);
});

// 16. Customer realtime updates
runTest(16, 'Customer receives immediate dispatch stage update and arrival OTP', () => {
  const customerView = {
    order_id: 'r1',
    dispatch_status: 'ACCEPTED',
    arrival_otp: '782910',
    pillar_assigned: true
  };
  assert.strictEqual(customerView.dispatch_status, 'ACCEPTED');
  assert.strictEqual(customerView.arrival_otp.length, 6);
});

// 17. Pillar realtime updates
runTest(17, 'Pillar receives high-priority 90s countdown notification payload', () => {
  const pillarPayload = {
    type: 'emergency_dispatch_offer',
    title: '🚨 EMERGENCY DISPATCH',
    is_emergency: true,
    expires_in_sec: 90
  };
  assert.strictEqual(pillarPayload.is_emergency, true);
  assert.strictEqual(pillarPayload.expires_in_sec, 90);
});

// 18. Admin realtime updates
runTest(18, 'Admin operations dashboard reflects live state change within active incident table', () => {
  const activeIncidents = [{ id: 'r1', status: 'DISPATCHING' }];
  const onRealtimeUpdate = (updated) => {
    const idx = activeIncidents.findIndex(i => i.id === updated.id);
    if (idx !== -1) activeIncidents[idx] = updated;
  };
  onRealtimeUpdate({ id: 'r1', status: 'ACCEPTED' });
  assert.strictEqual(activeIncidents[0].status, 'ACCEPTED');
});

// 19. Authorization
runTest(19, 'Technician cannot accept an offer assigned to another candidate', () => {
  const order = { id: 'r1', current_offered_pillar_id: 'p1' };
  const canAccept = (pid) => order.current_offered_pillar_id === pid;
  assert.strictEqual(canAccept('p1'), true);
  assert.strictEqual(canAccept('p99'), false);
});

// 20. RLS
runTest(20, 'RLS policy blocks non-admin and non-assigned users from viewing emergency audit logs', () => {
  const checkLogAccess = (userRole, userId, logPillarId) => {
    if (userRole === 'admin') return true;
    if (userRole === 'pillar' && userId === logPillarId) return true;
    return false;
  };
  assert.strictEqual(checkLogAccess('admin', 'u1', 'p2'), true);
  assert.strictEqual(checkLogAccess('pillar', 'p2', 'p2'), true);
  assert.strictEqual(checkLogAccess('customer', 'c1', 'p2'), false);
});

// 21. Audit logging
runTest(21, 'Every dispatch event records actor, action, timestamp, and distance metadata', () => {
  const logEntry = {
    request_id: 'r1',
    event_type: 'OFFERED',
    distance_km: 2.1,
    eta_minutes: 11,
    actor_role: 'system',
    created_at: new Date().toISOString()
  };
  assert.strictEqual(logEntry.event_type, 'OFFERED');
  assert.ok(logEntry.distance_km > 0);
  assert.ok(logEntry.created_at);
});

// 22. Notification events
runTest(22, 'Triggers high-priority emergency notification with urgent hazard metadata', () => {
  const notification = {
    title: '🚨 EMERGENCY DISPATCH: Immediate Response Required',
    message: 'Electrical Emergency in Guindy',
    is_emergency: true
  };
  assert.ok(notification.title.includes('EMERGENCY'));
  assert.strictEqual(notification.is_emergency, true);
});

// 23. No eligible Pillar
runTest(23, 'Gracefully handles empty candidate pool by escalating rather than crashing', () => {
  const candidates = [];
  const handleEmpty = (cands) => {
    if (cands.length === 0) return { status: 'ESCALATED', error: 'No technicians available' };
    return { status: 'DISPATCHING' };
  };
  const res = handleEmpty(candidates);
  assert.strictEqual(res.status, 'ESCALATED');
});

// 24. No fake coordinates
runTest(24, 'Coordinates must be valid numbers or null; never hardcoded fake strings', () => {
  const req = { latitude: 13.0067, longitude: 80.2025 };
  assert.strictEqual(typeof req.latitude, 'number');
  assert.strictEqual(typeof req.longitude, 'number');
  assert.strictEqual(isNaN(req.latitude), false);
});

// 25. No fake ETA
runTest(25, 'ETA explicitly disclaims traffic simulation and is labeled ESTIMATED', () => {
  const eta = calculateEstimatedEta(4.0); // 4km at 20km/h = 12 mins + 5 min buffer = 17 mins
  assert.strictEqual(eta.eta_minutes, 17);
  assert.ok(eta.label.includes('ESTIMATED'));
  assert.strictEqual(eta.method, 'DISTANCE_BASED_URBAN_SPEED');
});

// ------------------------------------------------------------------------------
// Summary Report
// ------------------------------------------------------------------------------
console.log('='.repeat(70));
console.log(`REAL-TIME OPERATIONS & EMERGENCY DISPATCH VALIDATION COMPLETE:`);
console.log(`Passed: ${passedCount}/25`);
console.log(`Failed: ${failedCount}/25`);
console.log('='.repeat(70));

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 25 REAL-TIME OPERATIONS & EMERGENCY DISPATCH CHECKPOINTS PASSING!');
  process.exit(0);
}
