// FoodWise AI - Comprehensive End-to-End Verification Suite
// Tests all phases: Auth, Vision/Scan, Waste Validation, Dashboard, Forecasting, Surplus, Matching, Claims, Analytics

const BASE_URL = 'http://localhost:3000';

async function api(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runVerification() {
  console.log('====================================================');
  console.log('FOODWISE AI: END-TO-END SYSTEM VERIFICATION AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Telemetry and System Health
  console.log('--- Phase 0: System Health & Diagnostics ---');
  const health = await api('/api/telemetry');
  assert(health.ok && health.data.success, 'GET /api/telemetry returns 200 OK');
  assert(health.data.database.connected !== undefined, `Database status: ${health.data.database.engine}`);
  assert(typeof health.data.gemini.configured === 'boolean', `Gemini model status checked: ${health.data.gemini.configured ? 'Active' : 'Fallback Heuristic Ready'}`);

  // 2. Authentication & RBAC
  console.log('\n--- Phase 1: Authentication & RBAC ---');
  const loginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'arjun.rao@foodwise.org', password: 'kitchen123' }
  });
  assert(loginRes.ok && Boolean(loginRes.data.token), 'Kitchen Manager login successful with valid JWT');
  const token = loginRes.data.token;

  const meRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(meRes.ok && meRes.data.user.role === 'Kitchen Manager', 'GET /api/auth/me authenticates valid bearer token as Kitchen Manager');

  // 3. Waste Recording & Validation
  console.log('\n--- Phase 2: Waste Logging & Validation Guardrails ---');
  // Validation test: Empty weight rejected
  const emptyRes = await api('/api/waste-records', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { food_name: 'Basmati Rice', user_confirmed_quantity: '' }
  });
  assert(emptyRes.status === 400, 'Rejects empty scale weight (400 Bad Request)');

  // Validation test: Negative weight rejected
  const negRes = await api('/api/waste-records', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { food_name: 'Basmati Rice', user_confirmed_quantity: -4.5 }
  });
  assert(negRes.status === 400, 'Rejects negative weight measurement (400 Bad Request)');

  // Valid record submission
  const validWaste = await api('/api/waste-records', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      food_name: 'Basmati Rice Post-Service Tray',
      user_confirmed_quantity: 5.8,
      unit: 'kg',
      meal_shift: 'Lunch',
      station_name: 'Station #2 AI Scale',
      notes: 'End of service hot tray residue'
    }
  });
  assert(validWaste.ok && validWaste.data.record && validWaste.data.record.user_confirmed_quantity === 5.8, 'Stores verified human-confirmed waste record (5.8 kg)');

  // 4. Live Dashboard Metrics
  console.log('\n--- Phase 3: Dashboard Live Metrics ---');
  const dashRes = await api('/api/dashboard-metrics?includeDemo=true');
  assert(dashRes.ok && dashRes.data.success, 'GET /api/dashboard-metrics returns live aggregated data');
  assert(dashRes.data.metrics.totalFoodWastedKg > 0, `Recorded waste calculated: ${dashRes.data.metrics.totalFoodWastedKg} kg`);
  assert(dashRes.data.metrics.totalFoodSavedKg >= 0, `Food diverted count: ${dashRes.data.metrics.totalFoodSavedKg} kg`);

  // 5. Demand Forecasting Engine
  console.log('\n--- Phase 4: Demand Forecasting & Insufficient Data Guardrails ---');
  // Test 5a: Small headcount (100)
  const fSmall = await api('/api/forecast?shift=Lunch&diners=100&includeDemo=true');
  assert(fSmall.ok && fSmall.data.data.hasSufficientData, 'Forecast works for small headcount (100 diners)');
  const prodSmall = fSmall.data.data.recommendedProductionKg;

  // Test 5b: Large headcount (1500)
  const fLarge = await api('/api/forecast?shift=Lunch&diners=1500&includeDemo=true');
  assert(fLarge.ok && fLarge.data.data.recommendedProductionKg > prodSmall, `Forecast scales production: 100 diners=${prodSmall}kg, 1500 diners=${fLarge.data.data.recommendedProductionKg}kg`);

  // Test 5c: Weather effect (Rain vs Normal)
  const fNormal = await api('/api/forecast?shift=Lunch&diners=500&weather=Normal&includeDemo=true');
  const fRain = await api('/api/forecast?shift=Lunch&diners=500&weather=Rain&includeDemo=true');
  assert(
    fRain.data.data.recommendedProductionKg < fNormal.data.data.recommendedProductionKg,
    `Weather sensitivity: Normal=${fNormal.data.data.recommendedProductionKg}kg, Rain=${fRain.data.data.recommendedProductionKg}kg (-8% turnout factor)`
  );

  // Test 5d: Insufficient data guardrail
  const fSparse = await api('/api/forecast?shift=Lunch&diners=500&includeDemo=false');
  assert(
    fSparse.ok && fSparse.data.data.hasSufficientData === false,
    'Insufficient data guardrail blocks hallucinated forecast when < 3 records'
  );

  // 6. Surplus Creation, Matching & Claim Flow
  console.log('\n--- Phase 5: Surplus Redistribution & Claim Flow ---');
  const surplusRes = await api('/api/surplus', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      food_name: 'Hot Fresh Basmati Rice & Dal',
      quantity: 12.0,
      unit: 'kg',
      temperature_celsius: 65.5,
      packaging_type: 'Hygienic Steel Sealed (GN 1/1)',
      dietary_type: 'Vegetarian',
      available_until: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      pickup_location: 'Central Kitchen Dispatch Dock #2',
      notes: 'Freshly prepared surplus, maintained at >60°C'
    }
  });
  assert(surplusRes.ok && Boolean(surplusRes.data.listing.id), 'Created surplus food listing (12.0 kg)');
  const surplusId = surplusRes.data.listing.id;

  // Match ranking
  const matchRes = await api('/api/match-surplus', {
    method: 'POST',
    body: { surplusId, kitchenLat: 19.0657, kitchenLng: 72.8687 }
  });
  assert(matchRes.ok && matchRes.data.matches.length > 0, `Found ${matchRes.data.matches.length} ranked receiver NGOs`);
  const topMatch = matchRes.data.matches[0];
  console.log(`  Top Match: ${topMatch.receiver.name} (${topMatch.distanceKm} km, Score: ${topMatch.matchScore}/100)`);

  // Claim surplus item
  const claimRes = await api(`/api/surplus/${surplusId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { status: 'claimed' }
  });
  assert(claimRes.ok && (claimRes.data.listing.status === 'reserved' || claimRes.data.listing.status === 'claimed'), 'Item claimed by receiver -> status becomes "reserved"');

  // Verify item is claimed
  const allSurplus = await api('/api/surplus');
  const claimedItem = allSurplus.data.surplus.find((s: any) => s.id === surplusId);
  assert(claimedItem && (claimedItem.status === 'reserved' || claimedItem.status === 'claimed'), 'Surplus inventory reflects reserved/claimed status to all parties');

  // 7. Sustainability Analytics with Timeframe
  console.log('\n--- Phase 6: Sustainability Analytics & Transparent Formulae ---');
  const analyticsToday = await api('/api/analytics?timeframe=today&verifiedOnly=false');
  assert(analyticsToday.ok && analyticsToday.data.success, 'GET /api/analytics?timeframe=today succeeds');
  
  const analyticsAll = await api('/api/analytics?timeframe=all_time&verifiedOnly=false');
  assert(analyticsAll.ok && analyticsAll.data.metrics.mealsEquivalent > 0, `Meals provided: ${analyticsAll.data.metrics.mealsEquivalent}`);
  assert(analyticsAll.data.metrics.avoidedCo2eKg > 0, `Avoided CO2e: ${analyticsAll.data.metrics.avoidedCo2eKg} kg`);
  assert(analyticsAll.data.metrics.waterSavedLiters > 0, `Conserved water: ${analyticsAll.data.metrics.waterSavedLiters} L`);
  assert(analyticsAll.data.metrics.financialSavingsInr > 0, `Financial recovery: ₹${analyticsAll.data.metrics.financialSavingsInr}`);

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
