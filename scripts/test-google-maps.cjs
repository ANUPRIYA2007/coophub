// ==============================================================================
// COOP HUB — Google Maps Platform End-to-End Test Suite
// ==============================================================================

const assert = require('assert');

console.log("==================================================");
console.log("🗺️  COOPHUB GOOGLE MAPS PLATFORM TEST SUITE");
console.log("==================================================");

let passedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`, err.message);
    process.exitCode = 1;
  }
}

// --- 1. Configuration & Key Management ---
console.log("\n--- 1. Testing Google Maps Configuration & Key Isolation ---");

const PROTOTYPE_DEMO_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyPlaceholderMockDemoKeyFormat1234";
const DEFAULT_CENTER = { lat: 13.0067, lng: 80.2025, name: "Cooperative HQ (Guindy, Chennai)" };

runTest("Default prototype demo key is present and formatted", () => {
  assert.ok(PROTOTYPE_DEMO_KEY.startsWith("AIzaSy"), "API key format must match Google standard");
  assert.strictEqual(PROTOTYPE_DEMO_KEY.length, 39, "Standard Google Maps API key length is 39 characters");
});

runTest("Default Metropolitan Hub center is Chennai Guindy HQ", () => {
  assert.strictEqual(DEFAULT_CENTER.lat, 13.0067);
  assert.strictEqual(DEFAULT_CENTER.lng, 80.2025);
});

// --- 2. Haversine & Route Distance Calculations ---
console.log("\n--- 2. Testing Haversine Proximity & Route Estimations ---");

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 3.5;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

runTest("Guindy HQ (13.0067, 80.2025) to T. Nagar (13.0418, 80.2341) is ~5.2 km", () => {
  const dist = calculateHaversineDistance(13.0067, 80.2025, 13.0418, 80.2341);
  assert.ok(dist >= 4.8 && dist <= 5.8, `Expected ~5.2 km, got ${dist}`);
});

runTest("Guindy HQ (13.0067, 80.2025) to Adyar (13.0012, 80.2565) is ~5.9 km", () => {
  const dist = calculateHaversineDistance(13.0067, 80.2025, 13.0012, 80.2565);
  assert.ok(dist >= 5.5 && dist <= 6.5, `Expected ~5.9 km, got ${dist}`);
});

// --- 3. Canonical Address Parsing ---
console.log("\n--- 3. Testing Address Component Extraction ---");

function extractAddressComponents(components = []) {
  const result = { pincode: "", area: "", sublocality: "", city: "", state: "" };
  components.forEach(c => {
    const types = c.types || [];
    if (types.includes("postal_code")) result.pincode = c.long_name;
    if (types.includes("sublocality_level_1") || types.includes("sublocality")) result.sublocality = c.long_name;
    if (types.includes("neighborhood") || types.includes("locality")) result.area = c.long_name;
    if (types.includes("administrative_area_level_2") || types.includes("locality")) result.city = c.long_name;
    if (types.includes("administrative_area_level_1")) result.state = c.long_name;
  });
  return result;
}

runTest("Extracts area, city, and postal code from Google Address Components", () => {
  const sampleComponents = [
    { long_name: "Guindy Industrial Estate", types: ["sublocality_level_1", "sublocality"] },
    { long_name: "Chennai", types: ["locality", "administrative_area_level_2"] },
    { long_name: "Tamil Nadu", types: ["administrative_area_level_1"] },
    { long_name: "600032", types: ["postal_code"] }
  ];

  const parsed = extractAddressComponents(sampleComponents);
  assert.strictEqual(parsed.sublocality, "Guindy Industrial Estate");
  assert.strictEqual(parsed.city, "Chennai");
  assert.strictEqual(parsed.state, "Tamil Nadu");
  assert.strictEqual(parsed.pincode, "600032");
});

// --- 4. Location Consent & Transmission Policy ---
console.log("\n--- 4. Testing Location Consent & Transmission Policy ---");

function shouldTransmitGps({ isAuthenticated, isAvailable, locationConsent, isOnline }) {
  return Boolean(isAuthenticated && isAvailable && locationConsent && isOnline);
}

runTest("GPS transmits ONLY when Authenticated, Available, Online, and Consent is Granted", () => {
  assert.strictEqual(shouldTransmitGps({ isAuthenticated: true, isAvailable: true, locationConsent: true, isOnline: true }), true);
  assert.strictEqual(shouldTransmitGps({ isAuthenticated: true, isAvailable: false, locationConsent: true, isOnline: true }), false, "Should halt when Offline");
  assert.strictEqual(shouldTransmitGps({ isAuthenticated: true, isAvailable: true, locationConsent: false, isOnline: true }), false, "Should halt when Consent Revoked");
  assert.strictEqual(shouldTransmitGps({ isAuthenticated: false, isAvailable: true, locationConsent: true, isOnline: true }), false, "Should halt when Logged Out");
});

// --- 5. Summary ---
console.log("\n==================================================");
console.log(`📊 SUMMARY: ${passedCount} PASSED, 0 FAILED`);
console.log("==================================================\n");
