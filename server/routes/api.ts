// FoodWise AI - Express API Routes
// Verified multi-tenant data, RBAC protection, AI estimations, and fallback handling

import { Router } from 'express';
import authRouter, {
  AuthenticatedRequest,
  optionalAuth,
  requireAuth,
  requireRole
} from './auth.ts';
import {
  clearUserRecords,
  createAttendanceRecord,
  createHandoverLog,
  createMenu,
  createProductionRecord,
  createRedistributionMatch,
  createSurplusListing,
  getAttendanceRecords,
  getDashboardMetrics,
  getDatabaseStatus,
  getFoodItems,
  getHandoversLog,
  getHistoricalShiftRecords,
  getMenus,
  getProductionRecords,
  getReceivers,
  getRedistributionMatches,
  getSurplusListingById,
  getSurplusListings,
  getWasteRecords,
  insertWasteRecord,
  updateRedistributionMatch,
  updateSurplusStatus
} from '../db/index.ts';
import { SEED_FOOD_ITEMS } from '../db/seedData.ts';
import { calculateSustainabilityImpact } from '../services/analytics/sustainabilityEngine.ts';
import { computeDemandForecast } from '../services/forecasting/demandForecaster.ts';
import { analyzeFoodWasteImage } from '../services/gemini/foodWasteAnalyzer.ts';
import { rankReceiversForSurplus } from '../services/redistribution/matchingEngine.ts';

const router = Router();

// Mount Authentication Router
router.use('/auth', authRouter);

// Apply optionalAuth across all API routes so req.user is populated if token exists
router.use(optionalAuth);

// ----------------------------------------------------------------------
// SYSTEM STATUS & TELEMETRY
// ----------------------------------------------------------------------
router.get('/status', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );

  res.json({
    status: 'ok',
    app: 'FoodWise AI',
    version: '1.4.0',
    database: dbStatus,
    ai: {
      geminiConfigured,
      model: 'gemini-3.8-flash',
      status: geminiConfigured ? 'Available' : 'API Key Required for Live AI Vision'
    }
  });
});

router.get('/telemetry', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );

  res.json({
    success: true,
    status: 'ok',
    app: 'FoodWise AI',
    version: '1.4.0',
    database: dbStatus,
    gemini: {
      configured: geminiConfigured,
      model: 'gemini-3.8-flash',
      status: geminiConfigured ? 'Available' : 'API Key Required for Live AI Vision'
    }
  });
});

// ----------------------------------------------------------------------
// REAL OPERATIONAL DASHBOARD METRICS (PHASE 4)
// ----------------------------------------------------------------------
router.get('/dashboard-metrics', async (req: AuthenticatedRequest, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const orgId = req.user?.organization_id;
    const metrics = await getDashboardMetrics(includeDemo, orgId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// GEMINI VISION FOOD WASTE ANALYSIS (PHASE 5 & 6)
// ----------------------------------------------------------------------
router.post('/scan-waste', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please capture or upload a photograph of the food waste container.'
      });
    }

    const analysis = await analyzeFoodWasteImage(imageBase64, mimeType || 'image/jpeg');

    return res.json({
      success: true,
      data: analysis,
      classification: 'AI_ESTIMATION',
      requiresHumanConfirmation: true
    });
  } catch (err: any) {
    console.error('[API /scan-waste error]', err.message);

    const isKeyError = err.message.includes('GEMINI_API_KEY');
    return res.status(isKeyError ? 503 : 500).json({
      success: false,
      error: err.message || 'Failed to analyze food waste image.',
      code: isKeyError ? 'GEMINI_KEY_MISSING' : 'AI_PROCESSING_ERROR',
      hint: isKeyError
        ? 'Please configure GEMINI_API_KEY in the environment or Settings to enable real-time visual recognition.'
        : 'Ensure the image clearly shows food items inside a tray or container.'
    });
  }
});

// ----------------------------------------------------------------------
// WASTE RECORDS (PHASE 7 & 16)
// ----------------------------------------------------------------------
router.get('/waste-records', async (req: AuthenticatedRequest, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const orgId = req.user?.organization_id;
    const records = await getWasteRecords(includeDemo, orgId);
    res.json({ success: true, records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/waste-records', async (req: AuthenticatedRequest, res) => {
  try {
    // RBAC: If user is authenticated, verify role
    if (req.user && req.user.role === 'Receiver') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. NGO Receivers are not authorized to log kitchen waste.',
        code: 'FORBIDDEN'
      });
    }

    const {
      food_name,
      user_confirmed_quantity,
      unit,
      waste_level,
      image_url,
      ai_analysis_json,
      notes,
      service_shift,
      station_name,
      is_demo,
      organization_id
    } = req.body;

    if (!food_name || user_confirmed_quantity === undefined || isNaN(Number(user_confirmed_quantity))) {
      return res.status(400).json({
        success: false,
        error: 'Valid food item name and user-confirmed quantity are required.'
      });
    }

    if (Number(user_confirmed_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Confirmed waste quantity must be greater than 0 kg.'
      });
    }

    const targetOrgId = req.user?.organization_id || organization_id || 'org-central-04';

    const saved = await insertWasteRecord({
      food_name,
      user_confirmed_quantity: Number(user_confirmed_quantity),
      unit: unit || 'kg',
      waste_level: waste_level || 'medium',
      image_url,
      ai_analysis_json,
      notes,
      service_shift,
      station_name,
      organization_id: targetOrgId,
      is_demo: Boolean(is_demo)
    });

    res.json({
      success: true,
      message: 'Waste record saved successfully with human-verified scale weight.',
      record: saved
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// MENUS & PRODUCTION (PHASE 2 & 25)
// ----------------------------------------------------------------------
router.get('/menus', async (req: AuthenticatedRequest, res) => {
  try {
    const orgId = req.user?.organization_id;
    const menus = await getMenus(orgId);
    res.json({ success: true, menus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/menus', async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user && req.user.role === 'Receiver') {
      return res.status(403).json({ success: false, error: 'Receivers cannot create menus.' });
    }

    const { name, date, event_type } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, error: 'Menu name and date are required.' });
    }

    const orgId = req.user?.organization_id || 'org-central-04';
    const menu = await createMenu({
      organization_id: orgId,
      name,
      date,
      event_type: event_type || 'Regular Service'
    });

    res.status(201).json({ success: true, menu });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/production', async (req: AuthenticatedRequest, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const orgId = req.user?.organization_id;
    const records = await getProductionRecords(includeDemo, orgId);
    res.json({ success: true, records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/production', async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user && req.user.role === 'Receiver') {
      return res.status(403).json({ success: false, error: 'Receivers cannot log production.' });
    }

    const { food_item_id, quantity_produced, consumed_kg, waste_kg, unit, date, shift, is_demo } = req.body;
    if (!food_item_id || !quantity_produced) {
      return res.status(400).json({ success: false, error: 'food_item_id and quantity_produced are required.' });
    }

    const orgId = req.user?.organization_id || 'org-central-04';
    const record = await createProductionRecord({
      organization_id: orgId,
      food_item_id,
      quantity_produced: Number(quantity_produced),
      consumed_kg: consumed_kg ? Number(consumed_kg) : undefined,
      waste_kg: waste_kg ? Number(waste_kg) : undefined,
      unit: unit || 'kg',
      date: date || new Date().toISOString().split('T')[0],
      shift: shift || 'Lunch',
      is_demo: Boolean(is_demo)
    });

    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/attendance', async (req: AuthenticatedRequest, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const orgId = req.user?.organization_id;
    const records = await getAttendanceRecords(includeDemo, orgId);
    res.json({ success: true, records });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/attendance', async (req: AuthenticatedRequest, res) => {
  try {
    const { date, shift, expected_people, actual_people, is_demo } = req.body;
    if (!expected_people) {
      return res.status(400).json({ success: false, error: 'expected_people count is required.' });
    }

    const orgId = req.user?.organization_id || 'org-central-04';
    const record = await createAttendanceRecord({
      organization_id: orgId,
      date: date || new Date().toISOString().split('T')[0],
      shift: shift || 'Lunch',
      expected_people: Number(expected_people),
      actual_people: actual_people ? Number(actual_people) : undefined,
      is_demo: Boolean(is_demo)
    });

    res.status(201).json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// DEMAND FORECASTING (PHASE 8 & 9)
// ----------------------------------------------------------------------
router.get('/forecast', async (req, res) => {
  try {
    const shift = (req.query.shift as string) || 'Lunch';
    const diners = parseInt((req.query.diners as string) || '480', 10);
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const eventType = (req.query.eventType as string) || 'Regular Service';
    const weather = (req.query.weather as string) || 'Normal';
    const foodItemId = (req.query.foodItemId as string) || 'fi-rice-01';
    const includeDemo = req.query.includeDemo !== 'false';

    const foodItem = SEED_FOOD_ITEMS.find(f => f.id === foodItemId) || {
      id: foodItemId,
      name: 'Steamed Basmati Rice'
    };

    const historical = await getHistoricalShiftRecords(includeDemo);

    const result = computeDemandForecast(foodItem, historical, {
      date,
      shift,
      expectedDiners: diners,
      eventType,
      weather
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// SURPLUS MANAGEMENT (PHASE 10)
// ----------------------------------------------------------------------
router.get('/surplus', async (req: AuthenticatedRequest, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const orgId = req.user?.organization_id;
    const surplus = await getSurplusListings(includeDemo, orgId);
    res.json({ success: true, surplus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/surplus', async (req: AuthenticatedRequest, res) => {
  try {
    // RBAC check: Only Kitchen Manager or Admin can create surplus listings
    if (req.user && req.user.role !== 'Kitchen Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role "${req.user.role}" is not authorized to create surplus listings. Kitchen Manager role required.`,
        code: 'FORBIDDEN'
      });
    }

    const {
      food_name,
      quantity,
      unit,
      available_until,
      pickup_location,
      temperature_celsius,
      packaging_type,
      dietary_type,
      notes,
      is_demo
    } = req.body;

    if (!food_name || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Food name and positive surplus quantity are required.'
      });
    }

    const targetOrgId = req.user?.organization_id || 'org-central-04';

    const created = await createSurplusListing({
      food_name,
      quantity: Number(quantity),
      unit: unit || 'kg',
      available_until: available_until || new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      pickup_location: pickup_location || 'Central Kitchen Dispatch Dock #1',
      temperature_celsius: temperature_celsius ? Number(temperature_celsius) : 65.0,
      packaging_type: packaging_type || 'Hygienic Steel GN Container',
      dietary_type: dietary_type || 'Vegetarian',
      notes,
      organization_id: targetOrgId,
      is_demo: Boolean(is_demo)
    });

    res.json({ success: true, listing: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/surplus/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (status === 'claimed') {
      status = 'reserved';
    }

    if (!['available', 'reserved', 'matched', 'dispatched', 'delivered', 'expired', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status transition.' });
    }

    const updated = await updateSurplusStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Surplus listing not found.' });
    }

    // If delivered, automatically append to handovers log
    if (status === 'delivered') {
      await createHandoverLog({
        item_composition: updated.food_name,
        notes: updated.notes || 'Redistribution batch completed',
        weight_kg: Number(updated.quantity),
        temperature_c: updated.temperature_celsius || 65.0,
        recipient_ngo: updated.pickup_location || 'Verified Receiver Partner',
        status: `Delivered (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_demo: Boolean(updated.is_demo)
      });
    }

    res.json({ success: true, listing: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// RECEIVERS AND MATCHING LOGISTICS (PHASE 11, 12, 13, 14)
// ----------------------------------------------------------------------
router.get('/receivers', async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const receivers = await getReceivers(includeDemo);
    res.json({ success: true, receivers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/match-surplus', async (req, res) => {
  try {
    const { surplusId, kitchenLat, kitchenLng } = req.body;
    const surplusList = await getSurplusListings(true);
    const surplusItem = surplusList.find(s => s.id === surplusId);

    if (!surplusItem) {
      return res.status(404).json({ success: false, error: 'Surplus item not found.' });
    }

    const receivers = await getReceivers(true);
    const kitchenCoords = {
      latitude: Number(kitchenLat) || 19.0657,
      longitude: Number(kitchenLng) || 72.8687
    };

    const matches = rankReceiversForSurplus(surplusItem, kitchenCoords, receivers);

    res.json({
      success: true,
      surplusItem,
      matches
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// SUSTAINABILITY ANALYTICS (PHASE 15)
// ----------------------------------------------------------------------
router.get('/analytics', async (req: AuthenticatedRequest, res) => {
  try {
    const verifiedOnly = req.query.verifiedOnly === 'true';
    const timeframe = (req.query.timeframe as string) || 'all_time';
    const orgId = req.user?.organization_id;
    let wasteRecords = await getWasteRecords(!verifiedOnly, orgId);
    let surplusList = await getSurplusListings(!verifiedOnly, orgId);
    let handovers = await getHandoversLog(!verifiedOnly);

    if (timeframe !== 'all_time') {
      const now = new Date();
      const filterByTime = (dateStr?: string) => {
        if (!dateStr) return true;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return true;
        if (timeframe === 'today') {
          return d.toDateString() === now.toDateString();
        }
        if (timeframe === 'this_week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
          return d >= sevenDaysAgo;
        }
        if (timeframe === 'this_month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      };

      wasteRecords = wasteRecords.filter(r => filterByTime(r.created_at));
      surplusList = surplusList.filter(s => filterByTime(s.created_at));
    }

    const metrics = calculateSustainabilityImpact(wasteRecords, surplusList, handovers, verifiedOnly);

    res.json({ success: true, metrics, timeframe });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// HANDOVERS LOG
// ----------------------------------------------------------------------
router.get('/handovers', async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== 'false';
    const handovers = await getHandoversLog(includeDemo);
    res.json({ success: true, handovers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------
// RESET / CLEAR USER RECORDS (PHASE 23)
// ----------------------------------------------------------------------
router.post('/reset-data', async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user && req.user.role !== 'Admin' && req.user.role !== 'Kitchen Manager') {
      return res.status(403).json({ success: false, error: 'Only Admin or Kitchen Manager can reset data.' });
    }
    const result = await clearUserRecords();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
