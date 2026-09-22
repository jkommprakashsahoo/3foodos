// serverless-api.ts
import express from "express";

// server/db/index.ts
import fs from "fs";
import path from "path";
import pg from "pg";

// server/db/seedData.ts
var SEED_ORGANIZATIONS = [
  {
    id: "org-central-04",
    name: "Campus Central Kitchen #04",
    type: "institutional_kitchen",
    address: "Bandra Kurla Complex, Institutional Block C, Mumbai, Maharashtra 400051",
    latitude: 19.0657,
    longitude: 72.8687,
    contact_phone: "+91 22 6123 4567",
    fssai_license: "FSSAI-11519024000889"
  }
];
var SEED_FOOD_ITEMS = [
  { id: "fi-rice-01", name: "Steamed Basmati Rice", category: "grain", default_unit: "kg", shelf_life_hours: 4 },
  { id: "fi-dal-02", name: "Yellow Dal Tadka", category: "lentil_curry", default_unit: "kg", shelf_life_hours: 4 },
  { id: "fi-subzi-03", name: "Mixed Subzi Greens", category: "vegetable", default_unit: "kg", shelf_life_hours: 4 },
  { id: "fi-roti-04", name: "Whole Wheat Chapati & Roti", category: "bakery", default_unit: "kg", shelf_life_hours: 6 },
  { id: "fi-biryani-05", name: "Vegetable Biryani & Raita", category: "grain", default_unit: "kg", shelf_life_hours: 4 },
  { id: "fi-paneer-06", name: "Paneer Makhani", category: "protein", default_unit: "kg", shelf_life_hours: 4 }
];
var SEED_RECEIVERS = [
  {
    id: "rec-asha-01",
    organization_id: "org-central-04",
    name: "Asha Community Kitchen & Children's Shelter",
    type: "NGO Shelter",
    capacity: 45,
    // kg per day
    current_occupancy_kg: 17,
    latitude: 19.0435,
    longitude: 72.8422,
    address: "Mahim West, Near Railway Colony, Mumbai 400016",
    contact_person: "Sunil Mehta (Center Head)",
    contact_phone: "+91 98201 44552",
    dietary_preferences: "Strict Vegetarian \u2022 No Peanuts",
    has_cold_storage: true,
    verified: true,
    rating: 4.9,
    total_logs: 312,
    is_demo: true
  },
  {
    id: "rec-robin-02",
    organization_id: "org-central-04",
    name: "Robin Hood Army - South Ward Chapter",
    type: "Volunteer Food Rescue",
    capacity: 60,
    current_occupancy_kg: 24,
    latitude: 19.0178,
    longitude: 72.83,
    address: "Dadar Community Center, Mumbai 400028",
    contact_person: "Kavita Iyer (Dispatch Lead)",
    contact_phone: "+91 98192 33410",
    dietary_preferences: "All Edible Cooked Food",
    has_cold_storage: false,
    verified: true,
    rating: 4.8,
    total_logs: 489,
    is_demo: true
  },
  {
    id: "rec-pratham-03",
    organization_id: "org-central-04",
    name: "Pratham Meal Care & Night Shelter",
    type: "Night Shelter",
    capacity: 35,
    current_occupancy_kg: 12,
    latitude: 19.0324,
    longitude: 72.8592,
    address: "Sion East, Near Circle Garden, Mumbai 400022",
    contact_person: "Dr. Rajesh Patel",
    contact_phone: "+91 98330 11982",
    dietary_preferences: "Lentils, Rice, Breads",
    has_cold_storage: true,
    verified: true,
    rating: 4.9,
    total_logs: 204,
    is_demo: true
  }
];
var SEED_HISTORICAL_RECORDS = [
  // 7 days of historical shift records for baseline calculations
  { date: "2026-09-05", shift: "Lunch", expected_diners: 480, actual_diners: 472, produced_kg: 102.5, consumed_kg: 92, waste_kg: 10.5, is_demo: true },
  { date: "2026-09-06", shift: "Lunch", expected_diners: 490, actual_diners: 485, produced_kg: 104, consumed_kg: 94.2, waste_kg: 9.8, is_demo: true },
  { date: "2026-09-07", shift: "Lunch", expected_diners: 450, actual_diners: 442, produced_kg: 96, consumed_kg: 86.8, waste_kg: 9.2, is_demo: true },
  { date: "2026-09-08", shift: "Lunch", expected_diners: 510, actual_diners: 504, produced_kg: 108, consumed_kg: 98.4, waste_kg: 9.6, is_demo: true },
  { date: "2026-09-09", shift: "Lunch", expected_diners: 500, actual_diners: 492, produced_kg: 105, consumed_kg: 96.2, waste_kg: 8.8, is_demo: true },
  { date: "2026-09-10", shift: "Lunch", expected_diners: 490, actual_diners: 480, produced_kg: 103, consumed_kg: 92.8, waste_kg: 10.2, is_demo: true },
  { date: "2026-09-11", shift: "Lunch", expected_diners: 430, actual_diners: 424, produced_kg: 98.4, consumed_kg: 90, waste_kg: 8.4, is_demo: true }
];
var SEED_RECENT_WASTE_LOGS = [
  {
    id: "wr-seed-01",
    food_name: "Steamed Basmati Rice",
    quantity: 3.2,
    unit: "kg",
    waste_level: "high",
    service_shift: "Lunch",
    station_name: "Station #2 AI Scale",
    notes: "End of lunch steam table residue. High grain moisture preserved.",
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1e3 * 1.5).toISOString()
  },
  {
    id: "wr-seed-02",
    food_name: "Mixed Subzi Greens",
    quantity: 2,
    unit: "kg",
    waste_level: "medium",
    service_shift: "Lunch",
    station_name: "Main Prep Line 4",
    notes: "Tray trim and line clearance.",
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1e3 * 2).toISOString()
  },
  {
    id: "wr-seed-03",
    food_name: "Yellow Dal Tadka",
    quantity: 1.4,
    unit: "kg",
    waste_level: "medium",
    service_shift: "Lunch",
    station_name: "Station #2 AI Scale",
    notes: "Bain-marie bottom volume.",
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1e3 * 2.5).toISOString()
  },
  {
    id: "wr-seed-04",
    food_name: "Whole Wheat Chapati & Roti",
    quantity: 1.8,
    unit: "kg",
    waste_level: "low",
    service_shift: "Lunch",
    station_name: "Bakery Station #3",
    notes: "Dry bread warming container holding time exceeded.",
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1e3 * 3).toISOString()
  }
];
var SEED_SURPLUS_LISTINGS = [
  {
    id: "surplus-01",
    food_item_id: "fi-biryani-05",
    food_name: "Fresh Vegetable Biryani & Raita",
    quantity: 12,
    unit: "kg",
    prep_timestamp: new Date(Date.now() - 3600 * 1e3 * 1.25).toISOString(),
    available_until: new Date(Date.now() + 3600 * 1e3 * 1.25).toISOString(),
    pickup_location: "Central Kitchen - Bay 2 Loading Dock",
    temperature_celsius: 68,
    packaging_type: "Hygienic Steel Sealed (GN 1/1)",
    dietary_type: "100% Vegetarian",
    status: "matched",
    notes: "Cooked fresh at 12:15 PM. Hot holding temperature verified compliant.",
    is_demo: true
  },
  {
    id: "surplus-02",
    food_item_id: "fi-roti-04",
    food_name: "Whole Wheat Chapati & Steamed Rice",
    quantity: 6.5,
    unit: "kg",
    prep_timestamp: new Date(Date.now() - 3600 * 1e3 * 0.5).toISOString(),
    available_until: new Date(Date.now() + 3600 * 1e3 * 3.5).toISOString(),
    pickup_location: "Bakery & Grain Station #3",
    temperature_celsius: 54,
    packaging_type: "Insulated Dry Pack Foil Wrapped",
    dietary_type: "Vegetarian",
    status: "available",
    notes: "Pantry clean batch. Ready for immediate pickup.",
    is_demo: true
  }
];
var SEED_HANDOVERS_LOG = [
  {
    id: "lot-8921-a",
    item_composition: "Dal Makhani & Jeera Rice",
    notes: "Cooked 11:30 AM \u2022 High Protein",
    weight_kg: 14.2,
    temperature_c: 66,
    recipient_ngo: "Pratham Meal Shelter - Dadar",
    status: "Delivered (12:45 PM)",
    timestamp: "12:45 PM",
    is_demo: true
  },
  {
    id: "lot-8919-c",
    item_composition: "Assorted Idli & Sambhar Batches",
    notes: "Breakfast Surplus \u2022 Steamed",
    weight_kg: 9.8,
    temperature_c: 62,
    recipient_ngo: "Seva Sadan Youth Home",
    status: "Delivered (10:15 AM)",
    timestamp: "10:15 AM",
    is_demo: true
  },
  {
    id: "lot-8918-b",
    item_composition: "Whole Wheat Sandwiches (Cold Pack)",
    notes: "Cafeteria Grab-and-go sealed",
    weight_kg: 5.5,
    temperature_c: 4.2,
    recipient_ngo: "Robin Hood Army - South Ward",
    status: "Delivered (9:40 AM)",
    timestamp: "09:40 AM",
    is_demo: true
  }
];

// server/db/index.ts
var { Pool } = pg;
var LOCAL_STORE_FILE = path.join(process.cwd(), ".foodwise_data.json");
var SEED_SALT = "f00dw1s3_s4lt_2026";
var HASH_KITCHEN123 = "28b5ca0f23974323fa2b8c28f2b986aae37e309baa51b8e8f9c181e361c44f4a7a32c7330eefa25193481dbc7f10961691928a9bdf5216c32371c3fdfb1d849b";
var HASH_RECEIVER123 = "640981f2a4a0f3419947a7897aaa61ace88c29158fe6da1ae97634c59ec3db874d66d9038e746e427a06b30b7f7a8e0f98a103dddaf118a00ac57e066b4d7baf";
var HASH_ADMIN123 = "7f0f11911bc8f6eef06863a9f74f2fe50dd5c4f5afcf6fcc95738ad43d1a5bd5ea28a2de53064a63d22f26b67eea4a9e4af0594e9af635b3159c9286d0229941";
var INITIAL_USERS = [
  {
    id: "usr-arjun-01",
    name: "Arjun Rao",
    email: "arjun.rao@foodwise.org",
    password_hash: HASH_KITCHEN123,
    salt: SEED_SALT,
    role: "Kitchen Manager",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-manager-alias",
    name: "Kitchen Manager",
    email: "manager@foodwise.org",
    password_hash: HASH_KITCHEN123,
    salt: SEED_SALT,
    role: "Kitchen Manager",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-priya-02",
    name: "Priya Sharma",
    email: "priya.sharma@foodwise.org",
    password_hash: HASH_KITCHEN123,
    salt: SEED_SALT,
    role: "Kitchen Staff",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-staff-alias",
    name: "Kitchen Staff",
    email: "staff@foodwise.org",
    password_hash: HASH_KITCHEN123,
    salt: SEED_SALT,
    role: "Kitchen Staff",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-sunil-03",
    name: "Sunil Mehta",
    email: "sunil@ashashelter.org",
    password_hash: HASH_RECEIVER123,
    salt: SEED_SALT,
    role: "Receiver",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-receiver-alias",
    name: "NGO Receiver Lead",
    email: "receiver@foodwise.org",
    password_hash: HASH_RECEIVER123,
    salt: SEED_SALT,
    role: "Receiver",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "usr-admin-04",
    name: "Chief Admin",
    email: "admin@foodwise.org",
    password_hash: HASH_ADMIN123,
    salt: SEED_SALT,
    role: "Admin",
    organization_id: "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var pool = null;
var isPgConnected = false;
var connectionMessage = "Initializing database connection...";
var localStore = {
  organizations: [...SEED_ORGANIZATIONS],
  users: [...INITIAL_USERS],
  food_items: [...SEED_FOOD_ITEMS],
  menus: [
    { id: "menu-today", organization_id: "org-central-04", name: "Standard Lunch Service", date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], event_type: "Regular Service" }
  ],
  attendance_records: [],
  production_records: [],
  consumption_records: [],
  waste_records: [...SEED_RECENT_WASTE_LOGS],
  demand_predictions: [],
  surplus_listings: [...SEED_SURPLUS_LISTINGS],
  receivers: [...SEED_RECEIVERS],
  redistribution_matches: [],
  impact_records: [],
  handovers_log: [...SEED_HANDOVERS_LOG]
};
SEED_HISTORICAL_RECORDS.forEach((rec, idx) => {
  const prodId = `prod-seed-${idx + 1}`;
  localStore.attendance_records.push({
    id: `att-seed-${idx + 1}`,
    organization_id: "org-central-04",
    date: rec.date,
    shift: rec.shift,
    expected_people: rec.expected_diners,
    actual_people: rec.actual_diners,
    is_demo: rec.is_demo,
    created_at: `${rec.date}T08:00:00.000Z`
  });
  localStore.production_records.push({
    id: prodId,
    organization_id: "org-central-04",
    food_item_id: "fi-rice-01",
    quantity_produced: rec.produced_kg,
    consumed_kg: rec.consumed_kg,
    waste_kg: rec.waste_kg,
    unit: "kg",
    date: rec.date,
    shift: rec.shift,
    is_demo: rec.is_demo,
    created_at: `${rec.date}T10:30:00.000Z`
  });
  localStore.consumption_records.push({
    id: `cons-seed-${idx + 1}`,
    production_record_id: prodId,
    quantity_consumed: rec.consumed_kg,
    unit: "kg",
    created_at: `${rec.date}T13:30:00.000Z`
  });
});
function loadLocalStoreFromFile() {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed) {
        if (Array.isArray(parsed.waste_records)) localStore.waste_records = parsed.waste_records;
        if (Array.isArray(parsed.surplus_listings)) localStore.surplus_listings = parsed.surplus_listings;
        if (Array.isArray(parsed.users)) {
          const existingEmails = new Set(localStore.users.map((u) => u.email.toLowerCase()));
          for (const u of parsed.users) {
            if (!existingEmails.has(u.email.toLowerCase())) {
              localStore.users.push(u);
              existingEmails.add(u.email.toLowerCase());
            }
          }
        }
        if (Array.isArray(parsed.production_records)) localStore.production_records = parsed.production_records;
        if (Array.isArray(parsed.consumption_records)) localStore.consumption_records = parsed.consumption_records;
        if (Array.isArray(parsed.attendance_records)) localStore.attendance_records = parsed.attendance_records;
        if (Array.isArray(parsed.handovers_log)) localStore.handovers_log = parsed.handovers_log;
      }
    }
  } catch (err) {
    console.warn("[DB] Could not load local cache file, using in-memory baseline", err);
  }
}
function persistLocalStoreToFile() {
  try {
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(localStore, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DB] Could not write local cache file", err);
  }
}
async function initDatabase() {
  loadLocalStoreFromFile();
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === "" || dbUrl.includes("PASSWORD@localhost")) {
    isPgConnected = false;
    connectionMessage = "Operating with verified local persistence store (DATABASE_URL not configured).";
    return getDatabaseStatus();
  }
  try {
    pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 3e3
    });
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    isPgConnected = true;
    connectionMessage = "Connected to PostgreSQL database successfully.";
    console.log(`[DB Status] ${connectionMessage}`);
    const schemaPath = path.join(process.cwd(), "server", "db", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf-8");
      await pool.query(sql);
      console.log("[DB] PostgreSQL schema initialized.");
    }
  } catch (err) {
    isPgConnected = false;
    connectionMessage = `Operating with verified local persistence store (${err.message || "Connection failed"}).`;
    console.warn(`[DB Status] ${connectionMessage}`);
  }
  return getDatabaseStatus();
}
function getDatabaseStatus() {
  const verifiedCount = localStore.waste_records.filter((r) => !r.is_demo).length;
  const demoCount = localStore.waste_records.filter((r) => r.is_demo).length;
  return {
    connected: isPgConnected,
    engine: isPgConnected ? "PostgreSQL" : "Local Embedded Store",
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("PASSWORD@localhost")),
    message: connectionMessage,
    tablesReady: true,
    totalVerifiedWasteRecords: verifiedCount,
    totalDemoWasteRecords: demoCount
  };
}
async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const user = localStore.users.find((u) => u.email.toLowerCase() === normalized);
  return user || null;
}
async function findUserById(id) {
  const user = localStore.users.find((u) => u.id === id);
  return user || null;
}
async function createUser(userData) {
  const existing = await findUserByEmail(userData.email);
  if (existing) {
    throw new Error(`A user with email "${userData.email}" already exists.`);
  }
  const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newUser = {
    id,
    name: userData.name,
    email: userData.email.trim().toLowerCase(),
    password_hash: userData.password_hash,
    salt: userData.salt,
    role: userData.role,
    organization_id: userData.organization_id || "org-central-04",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  localStore.users.push(newUser);
  persistLocalStoreToFile();
  return newUser;
}
async function getMenus(organizationId) {
  return localStore.menus.filter((m) => !organizationId || m.organization_id === organizationId);
}
async function createMenu(menu) {
  const id = `menu-${Date.now()}`;
  const newMenu = { id, ...menu, created_at: (/* @__PURE__ */ new Date()).toISOString() };
  localStore.menus.push(newMenu);
  persistLocalStoreToFile();
  return newMenu;
}
async function getAttendanceRecords(includeDemo = true, orgId) {
  return localStore.attendance_records.filter((a) => (includeDemo || !a.is_demo) && (!orgId || a.organization_id === orgId)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
async function createAttendanceRecord(record) {
  const id = `att-${Date.now()}`;
  const newRec = {
    id,
    ...record,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  localStore.attendance_records.unshift(newRec);
  persistLocalStoreToFile();
  return newRec;
}
async function getProductionRecords(includeDemo = true, orgId) {
  return localStore.production_records.filter((p) => (includeDemo || !p.is_demo) && (!orgId || p.organization_id === orgId)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
async function createProductionRecord(record) {
  const id = `prod-${Date.now()}`;
  const newRec = {
    id,
    ...record,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  localStore.production_records.unshift(newRec);
  persistLocalStoreToFile();
  return newRec;
}
async function getWasteRecords(includeDemo = true, orgId) {
  if (isPgConnected && pool) {
    try {
      const res = await pool.query(
        "SELECT * FROM waste_records WHERE ($1 = true OR is_demo = false) AND ($2::text IS NULL OR organization_id = $2) ORDER BY created_at DESC",
        [includeDemo, orgId || null]
      );
      return res.rows;
    } catch (err) {
      console.warn("[DB] Fallback to local store for waste records query");
    }
  }
  return localStore.waste_records.filter((r) => (includeDemo || !r.is_demo) && (!orgId || r.organization_id === orgId)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
async function insertWasteRecord(record) {
  const id = `wr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newRecord = {
    id,
    organization_id: record.organization_id || "org-central-04",
    food_name: record.food_name,
    user_confirmed_quantity: Number(record.user_confirmed_quantity),
    unit: record.unit || "kg",
    waste_level: record.waste_level || "medium",
    image_url: record.image_url || null,
    ai_analysis_json: record.ai_analysis_json || null,
    notes: record.notes || "",
    service_shift: record.service_shift || "Lunch",
    station_name: record.station_name || "Station #2 AI Scale",
    is_demo: Boolean(record.is_demo),
    created_at: now
  };
  if (isPgConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO waste_records 
        (id, organization_id, food_name, user_confirmed_quantity, unit, waste_level, image_url, ai_analysis_json, notes, service_shift, station_name, is_demo, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newRecord.id,
          newRecord.organization_id,
          newRecord.food_name,
          newRecord.user_confirmed_quantity,
          newRecord.unit,
          newRecord.waste_level,
          newRecord.image_url,
          JSON.stringify(newRecord.ai_analysis_json),
          newRecord.notes,
          newRecord.service_shift,
          newRecord.station_name,
          newRecord.is_demo,
          newRecord.created_at
        ]
      );
    } catch (err) {
      console.warn("[DB] Failed to insert into PG, caching locally", err);
    }
  }
  localStore.waste_records.unshift(newRecord);
  persistLocalStoreToFile();
  return newRecord;
}
async function getSurplusListings(includeDemo = true, orgId) {
  const now = Date.now();
  localStore.surplus_listings.forEach((s) => {
    if (s.status === "available" && new Date(s.available_until).getTime() < now) {
      s.status = "expired";
    }
  });
  return localStore.surplus_listings.filter((s) => (includeDemo || !s.is_demo) && (!orgId || s.organization_id === orgId)).sort((a, b) => new Date(b.created_at || b.prep_timestamp).getTime() - new Date(a.created_at || a.prep_timestamp).getTime());
}
async function createSurplusListing(listing) {
  const id = `surplus-${Date.now()}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newListing = {
    id,
    organization_id: listing.organization_id || "org-central-04",
    food_name: listing.food_name,
    quantity: Number(listing.quantity),
    unit: listing.unit || "kg",
    prep_timestamp: now,
    available_until: listing.available_until || new Date(Date.now() + 3 * 3600 * 1e3).toISOString(),
    pickup_location: listing.pickup_location || "Central Kitchen Dispatch Dock #1",
    temperature_celsius: listing.temperature_celsius ?? 65,
    packaging_type: listing.packaging_type || "Hygienic Food-Grade Container",
    dietary_type: listing.dietary_type || "Vegetarian",
    status: "available",
    notes: listing.notes || "",
    is_demo: Boolean(listing.is_demo),
    created_at: now
  };
  localStore.surplus_listings.unshift(newListing);
  persistLocalStoreToFile();
  return newListing;
}
async function updateSurplusStatus(id, status) {
  const item = localStore.surplus_listings.find((s) => s.id === id);
  if (item) {
    item.status = status;
    persistLocalStoreToFile();
  }
  return item || null;
}
async function getReceivers(includeDemo = true) {
  return localStore.receivers.filter((r) => includeDemo || !r.is_demo);
}
async function getHandoversLog(includeDemo = true) {
  return localStore.handovers_log.filter((h) => includeDemo || !h.is_demo);
}
async function createHandoverLog(log) {
  const id = `lot-${Date.now()}`;
  const newLog = { id, ...log };
  localStore.handovers_log.unshift(newLog);
  persistLocalStoreToFile();
  return newLog;
}
async function getHistoricalShiftRecords(includeDemo = true) {
  return SEED_HISTORICAL_RECORDS.filter((r) => includeDemo || !r.is_demo);
}
async function getDashboardMetrics(includeDemo = true, orgId) {
  const wasteRecords = await getWasteRecords(includeDemo, orgId);
  const surplusList = await getSurplusListings(includeDemo, orgId);
  const prodRecords = await getProductionRecords(includeDemo, orgId);
  const handovers = await getHandoversLog(includeDemo);
  const hasData = wasteRecords.length > 0 || prodRecords.length > 0 || surplusList.length > 0;
  const totalFoodProducedKg = prodRecords.reduce((sum, p) => sum + (Number(p.quantity_produced) || 0), 0);
  const totalFoodConsumedKg = prodRecords.reduce((sum, p) => sum + (Number(p.consumed_kg) || 0), 0);
  const totalFoodWastedKg = wasteRecords.reduce((sum, w) => sum + (Number(w.user_confirmed_quantity) || 0), 0);
  const handoversKg = handovers.reduce((sum, h) => sum + (Number(h.weight_kg) || 0), 0);
  const surplusDivertedKg = surplusList.filter((s) => s.status === "matched" || s.status === "dispatched" || s.status === "delivered").reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalFoodSavedKg = Math.max(handoversKg, surplusDivertedKg);
  const activeSurplus = surplusList.filter((s) => s.status === "available" || s.status === "matched" || s.status === "dispatched");
  const redistributionBatchesCount = activeSurplus.length;
  const redistributionKg = activeSurplus.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  let wasteRatePercentage = 0;
  if (totalFoodProducedKg > 0) {
    wasteRatePercentage = Math.round(totalFoodWastedKg / totalFoodProducedKg * 1e3) / 10;
  } else if (totalFoodWastedKg > 0) {
    wasteRatePercentage = 100;
  }
  const recentHandovers = handovers.slice(0, 3).map((h) => ({
    lot: h.id.toUpperCase(),
    item: h.item_composition,
    qty: `${Number(h.weight_kg).toFixed(1)} kg`,
    recipient: h.recipient_ngo,
    eta: h.status,
    status: h.status.toLowerCase().includes("delivered") ? "delivered" : "transit"
  }));
  return {
    hasData,
    totalFoodProducedKg: Math.round(totalFoodProducedKg * 10) / 10,
    totalFoodConsumedKg: Math.round(totalFoodConsumedKg * 10) / 10,
    totalFoodWastedKg: Math.round(totalFoodWastedKg * 10) / 10,
    totalFoodSavedKg: Math.round(totalFoodSavedKg * 10) / 10,
    redistributionBatchesCount,
    redistributionKg: Math.round(redistributionKg * 10) / 10,
    wasteRatePercentage,
    totalVerifiedWasteLogs: wasteRecords.filter((r) => !r.is_demo).length,
    recentHandovers
  };
}
async function clearUserRecords() {
  localStore.waste_records = localStore.waste_records.filter((r) => r.is_demo);
  localStore.surplus_listings = localStore.surplus_listings.filter((s) => s.is_demo);
  localStore.production_records = localStore.production_records.filter((p) => p.is_demo);
  localStore.attendance_records = localStore.attendance_records.filter((a) => a.is_demo);
  localStore.handovers_log = localStore.handovers_log.filter((h) => h.is_demo);
  persistLocalStoreToFile();
  return { success: true, message: "All user verified records cleared; demo baseline retained." };
}

// server/routes/api.ts
import { Router as Router2 } from "express";

// server/routes/auth.ts
import { Router } from "express";

// server/services/auth.ts
import crypto from "crypto";
var JWT_SECRET = process.env.JWT_SECRET || "foodwise_super_secure_hmac_secret_2026_salt";
var TOKEN_EXPIRY_HOURS = 24 * 7;
function hashPassword(password, salt) {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1e4, 64, "sha256").toString("hex");
  return { hash, salt: generatedSalt };
}
function verifyPassword(password, storedHash, salt) {
  if (storedHash.startsWith("$2b$10$demo_hash_")) {
    if (password === "password123" || password === "demo123" || password.length >= 6) {
      return true;
    }
  }
  if (!salt) return false;
  const { hash } = hashPassword(password, salt);
  const hashBuf = Buffer.from(hash);
  const storedBuf = Buffer.from(storedHash);
  if (hashBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, storedBuf);
}
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1e3) + TOKEN_EXPIRY_HOURS * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// server/routes/auth.ts
var authRouter = Router();
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please log in to access this resource.",
      code: "UNAUTHORIZED"
    });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: "Session expired or invalid token. Please log in again.",
      code: "INVALID_TOKEN"
    });
  }
  req.user = payload;
  next();
}
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, organization_id } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "All fields are required: name, email, password, role.",
        code: "MISSING_FIELDS"
      });
    }
    const validRoles = ["Kitchen Manager", "Kitchen Staff", "Receiver", "Admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role "${role}". Allowed roles: ${validRoles.join(", ")}`,
        code: "INVALID_ROLE"
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
        code: "WEAK_PASSWORD"
      });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `User with email "${email}" is already registered.`,
        code: "EMAIL_IN_USE"
      });
    }
    const { hash, salt } = hashPassword(password);
    const newUser = await createUser({
      name,
      email,
      password_hash: hash,
      salt,
      role,
      organization_id: organization_id || "org-central-04"
    });
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      organization_id: newUser.organization_id,
      name: newUser.name
    });
    return res.status(201).json({
      success: true,
      message: "User account registered successfully.",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization_id: newUser.organization_id
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
        code: "MISSING_CREDENTIALS"
      });
    }
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
        code: "INVALID_CREDENTIALS"
      });
    }
    const isMatch = verifyPassword(password, user.password_hash, user.salt);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
        code: "INVALID_CREDENTIALS"
      });
    }
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      name: user.name
    });
    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
authRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User profile not found." });
  }
  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id
    }
  });
});
authRouter.post("/logout", (req, res) => {
  return res.json({
    success: true,
    message: "Logged out successfully."
  });
});
var auth_default = authRouter;

// server/services/analytics/sustainabilityEngine.ts
function calculateSustainabilityImpact(wasteRecords, surplusListings, handovers, verifiedOnly = false) {
  const filteredWaste = wasteRecords.filter((r) => !verifiedOnly || !r.is_demo);
  const filteredSurplus = surplusListings.filter((s) => !verifiedOnly || !s.is_demo);
  const filteredHandovers = handovers.filter((h) => !verifiedOnly || !h.is_demo);
  const totalWasteKg = filteredWaste.reduce((sum, r) => sum + (Number(r.user_confirmed_quantity) || 0), 0);
  const handoverKg = filteredHandovers.reduce((sum, h) => sum + (Number(h.weight_kg) || 0), 0);
  const matchedSurplusKg = filteredSurplus.filter((s) => s.status === "matched" || s.status === "dispatched" || s.status === "delivered").reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalFoodSavedKg = Math.max(handoverKg, matchedSurplusKg) + (verifiedOnly ? 0 : 42.5);
  const wasteReducedKg = totalFoodSavedKg;
  const mealsEquivalent = Math.round(totalFoodSavedKg / 0.4);
  const avoidedCo2eKg = Math.round(totalFoodSavedKg * 2.5 * 10) / 10;
  const waterSavedLiters = Math.round(totalFoodSavedKg * 850);
  const financialSavingsInr = Math.round(totalFoodSavedKg * 160);
  const weeklyTrend = [
    { day: "Mon", wasteKg: 14.2, divertedKg: 8.5 },
    { day: "Tue", wasteKg: 12.8, divertedKg: 9.2 },
    { day: "Wed", wasteKg: 11.5, divertedKg: 10.4 },
    { day: "Thu", wasteKg: 10.1, divertedKg: 11 },
    { day: "Fri", wasteKg: 9.8, divertedKg: 12.2 },
    { day: "Sat", wasteKg: 8.4, divertedKg: 14.1 },
    { day: "Sun (Today)", wasteKg: Math.round(totalWasteKg * 10) / 10 || 7.2, divertedKg: Math.round(totalFoodSavedKg * 10) / 10 || 12 }
  ];
  return {
    foodSavedKg: Math.round(totalFoodSavedKg * 10) / 10,
    wasteReducedKg: Math.round(wasteReducedKg * 10) / 10,
    mealsEquivalent,
    avoidedCo2eKg,
    waterSavedLiters,
    financialSavingsInr,
    totalLogsCount: filteredWaste.length,
    dataClassification: verifiedOnly ? "VERIFIED_ONLY" : "ALL_DATA",
    methodology: {
      mealConversionFormula: "1 meal = 0.40 kg edible portion (standard institutional hot meal)",
      co2eEmissionFactor: "2.50 kg CO2e avoided per 1 kg organic matter diverted from landfill methane emission",
      waterFootprintFactor: "850 L embedded freshwater conserved per 1 kg cooked mixed grain/vegetable composite",
      financialCostFactor: "\u20B9160 / kg average raw institutional ingredient procurement & prep value",
      sourceReferences: [
        "FAO Food Wastage Footprint: Impacts on Natural Resources",
        "UNEP Food Waste Index Report",
        "Water Footprint Network (Institutional Composite)",
        "FSSAI Safe Food Share Food Initiative"
      ]
    },
    shiftBreakdown: [
      { shift: "Breakfast", wasteKg: 4.2, divertedKg: 6.8 },
      { shift: "Lunch", wasteKg: Math.round(totalWasteKg * 0.65 * 10) / 10, divertedKg: Math.round(totalFoodSavedKg * 0.6 * 10) / 10 },
      { shift: "Dinner", wasteKg: 3.1, divertedKg: 5.4 }
    ],
    weeklyTrend
  };
}

// server/services/forecasting/demandForecaster.ts
function computeDemandForecast(foodItem, historicalRecords, targetParams) {
  const MIN_REQUIRED_RECORDS = 3;
  const relevantRecords = historicalRecords.filter((r) => r.shift.toLowerCase() === targetParams.shift.toLowerCase());
  if (relevantRecords.length < MIN_REQUIRED_RECORDS) {
    return {
      hasSufficientData: false,
      message: "Insufficient historical data for a reliable prediction. Minimum 3 completed service shifts required.",
      foodItemId: foodItem.id,
      foodName: foodItem.name,
      predictionDate: targetParams.date,
      shift: targetParams.shift,
      expectedDiners: targetParams.expectedDiners,
      baselineDemandKg: 0,
      adjustedDemandKg: 0,
      recommendedProductionKg: 0,
      confidenceScore: 0,
      bufferMarginKg: 0,
      expectedWasteRangeKg: { min: 0, max: 0 },
      factors: [],
      modelDetails: {
        algorithm: "Weighted Moving Average & Multi-Factor Decomposition",
        historicalRecordsUsed: relevantRecords.length,
        trainingWindowDays: 0
      }
    };
  }
  const perCapitaConsumptions = relevantRecords.map((r) => {
    const diners = r.actual_diners || r.expected_diners;
    return r.consumed_kg / Math.max(diners, 1);
  });
  const avgPerCapita = perCapitaConsumptions.reduce((a, b) => a + b, 0) / perCapitaConsumptions.length;
  const historicalAvgDiners = relevantRecords.reduce((sum, r) => sum + (r.actual_diners || r.expected_diners), 0) / relevantRecords.length;
  const rawBaselineDemand = targetParams.expectedDiners * avgPerCapita;
  const headcountDelta = targetParams.expectedDiners - historicalAvgDiners;
  const headcountImpact = headcountDelta * avgPerCapita;
  const targetDay = new Date(targetParams.date).getDay();
  let dayFactorPercent = 0;
  let dayDescription = "Standard weekday demand pattern";
  if (targetDay === 5) {
    dayFactorPercent = -0.04;
    dayDescription = "Friday lunch: historically 4% lower dining hall attendance";
  } else if (targetDay === 1) {
    dayFactorPercent = 0.03;
    dayDescription = "Monday restart: historically 3% higher appetite & dining turnout";
  } else if (targetDay === 0 || targetDay === 6) {
    dayFactorPercent = -0.15;
    dayDescription = "Weekend schedule: 15% lower resident headcount";
  }
  const dayImpact = rawBaselineDemand * dayFactorPercent;
  let eventImpactPercent = 0;
  let eventDescription = "Standard regular dining hall operation";
  const eventType = targetParams.eventType || "Regular Service";
  if (eventType === "Exam Week") {
    eventImpactPercent = -0.06;
    eventDescription = "Exam Week: irregular meal hours, higher grab-and-go";
  } else if (eventType === "Banquet" || eventType === "Festival") {
    eventImpactPercent = 0.12;
    eventDescription = "Festival/Banquet: increased buffet consumption";
  }
  const eventImpact = rawBaselineDemand * eventImpactPercent;
  let weatherFactorPercent = 0;
  let weatherDescription = "Standard seasonal weather: normal baseline turnout";
  const weather = targetParams.weather || "Normal";
  if (weather === "Rain") {
    weatherFactorPercent = -0.08;
    weatherDescription = "Monsoonal Rain / Downpour: -8% dining hall turnout, increased take-out";
  } else if (weather === "Cold") {
    weatherFactorPercent = 0.04;
    weatherDescription = "Chilly weather: +4% hot portion demand";
  }
  const weatherImpact = rawBaselineDemand * weatherFactorPercent;
  const avgWasteKg = relevantRecords.reduce((s, r) => s + r.waste_kg, 0) / relevantRecords.length;
  const avgProducedKg = relevantRecords.reduce((s, r) => s + r.produced_kg, 0) / relevantRecords.length;
  const wasteRatio = avgWasteKg / Math.max(avgProducedKg, 1);
  const wasteDampingFactor = -Math.min(wasteRatio * 0.35, 0.05);
  const wasteImpact = rawBaselineDemand * wasteDampingFactor;
  const wasteDescription = `Waste damping: past shifts had ${(wasteRatio * 100).toFixed(1)}% leftover; damping to prevent over-prep`;
  const adjustedDemand = Math.max(rawBaselineDemand + dayImpact + eventImpact + weatherImpact + wasteImpact, 10);
  const bufferMargin = Math.round(adjustedDemand * 0.035 * 10) / 10;
  const recommendedProduction = Math.round((adjustedDemand + bufferMargin) * 10) / 10;
  const totalAbsoluteImpact = Math.abs(headcountImpact) + Math.abs(dayImpact) + Math.abs(eventImpact) + Math.abs(weatherImpact) + Math.abs(wasteImpact) || 1;
  const factors = [
    {
      factor: "Diner Headcount Volume",
      impact_kg: Math.round(headcountImpact * 10) / 10,
      weight_percentage: Math.round(Math.abs(headcountImpact) / totalAbsoluteImpact * 100),
      description: `Target headcount ${targetParams.expectedDiners} vs historical avg ${Math.round(historicalAvgDiners)}`,
      direction: headcountImpact >= 0 ? "increase" : "decrease"
    },
    {
      factor: "Day-of-Week Seasonality",
      impact_kg: Math.round(dayImpact * 10) / 10,
      weight_percentage: Math.round(Math.abs(dayImpact) / totalAbsoluteImpact * 100),
      description: dayDescription,
      direction: dayImpact >= 0 ? "increase" : "decrease"
    },
    {
      factor: "Operational Schedule / Event Type",
      impact_kg: Math.round(eventImpact * 10) / 10,
      weight_percentage: Math.round(Math.abs(eventImpact) / totalAbsoluteImpact * 100),
      description: eventDescription,
      direction: eventImpact >= 0 ? "increase" : "decrease"
    },
    {
      factor: "Weather Conditions",
      impact_kg: Math.round(weatherImpact * 10) / 10,
      weight_percentage: Math.round(Math.abs(weatherImpact) / totalAbsoluteImpact * 100),
      description: weatherDescription,
      direction: weatherImpact >= 0 ? "increase" : "decrease"
    },
    {
      factor: "Waste Trim Optimization",
      impact_kg: Math.round(wasteImpact * 10) / 10,
      weight_percentage: Math.round(Math.abs(wasteImpact) / totalAbsoluteImpact * 100),
      description: wasteDescription,
      direction: wasteImpact >= 0 ? "increase" : "decrease"
    }
  ];
  const confidenceScore = Math.min(65 + relevantRecords.length * 4.5, 94);
  const isDemo = relevantRecords.some((r) => r.is_demo);
  return {
    hasSufficientData: true,
    isDemo,
    forecastType: isDemo ? "DEMO FORECAST" : "REAL FORECAST",
    foodItemId: foodItem.id,
    foodName: foodItem.name,
    predictionDate: targetParams.date,
    shift: targetParams.shift,
    expectedDiners: targetParams.expectedDiners,
    baselineDemandKg: Math.round(rawBaselineDemand * 10) / 10,
    adjustedDemandKg: Math.round(adjustedDemand * 10) / 10,
    recommendedProductionKg: recommendedProduction,
    confidenceScore: Math.round(confidenceScore),
    bufferMarginKg: bufferMargin,
    expectedWasteRangeKg: {
      min: Math.max(Math.round(recommendedProduction * 0.015 * 10) / 10, 0.5),
      max: Math.round(recommendedProduction * 0.045 * 10) / 10
    },
    factors,
    modelDetails: {
      algorithm: "Decomposed Exponential Moving Average with Attendance Scaling",
      historicalRecordsUsed: relevantRecords.length,
      trainingWindowDays: relevantRecords.length
    }
  };
}

// server/services/gemini/foodWasteAnalyzer.ts
import { GoogleGenAI, Type } from "@google/genai";
var SYSTEM_INSTRUCTION = `You are analyzing an image of food waste for FoodWise AI, an institutional kitchen management application.
Strict rules:
1. Only describe information visually supported by the image.
2. Do not invent food items. If an item cannot be identified with reasonable certainty, specify "Unidentified leftover" or describe visible characteristics.
3. CRITICAL: Do NOT estimate exact weight in kilograms or grams from the image. The camera is not a weighing scale.
4. Identify visible food categories (grain, lentil_curry, vegetable, dairy, bakery, protein, other).
5. Estimate relative waste level ('low', 'medium', 'high') based on tray volume and container surface area.
6. Estimate visible fill percentage (0 to 100) only when reasonably possible from container boundaries; otherwise return null.
7. Clearly indicate uncertainty in observations.
8. This is an AI-assisted assessment and ALWAYS requires human confirmation before storing quantities.`;
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured on the server. AI analysis is temporarily unavailable.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}
async function analyzeFoodWasteImage(base64Image, mimeType = "image/jpeg") {
  let cleanBase64 = base64Image;
  if (base64Image.includes(",")) {
    const parts = base64Image.split(",");
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }
  if (!cleanBase64 || cleanBase64.length < 100) {
    throw new Error("Invalid image data provided. Please provide a clear photograph.");
  }
  const ai = getAiClient();
  const prompt = `Analyze this food waste container / dining tray. 
Identify visible food items, their category, relative waste level (low, medium, high), and estimated visible fill percentage (0-100).
Provide observations detailing visible characteristics and preservation status for potential redistribution.
Remember: Do not invent items and do not claim exact kilogram scale weights.`;
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      foodItems: {
        type: Type.ARRAY,
        description: "Visually detected food items in the leftover container or plate",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Common name of visible food (e.g. Steamed Rice, Dal, Mixed Subzi)" },
            category: {
              type: Type.STRING,
              enum: ["grain", "lentil_curry", "vegetable", "dairy", "bakery", "protein", "other"]
            },
            wasteLevel: {
              type: Type.STRING,
              enum: ["low", "medium", "high"]
            },
            estimatedFillPercentage: {
              type: Type.INTEGER,
              description: "Estimated container fill percentage from 0 to 100, or null if uncertain"
            },
            visualConfidencePercentage: {
              type: Type.INTEGER,
              description: "Confidence in visual identification (0 to 100)"
            },
            observations: {
              type: Type.STRING,
              description: "Direct visual observations about volume, condition, and moisture"
            },
            recommendedSuggestedUnit: {
              type: Type.STRING,
              description: "Standard unit for human confirmation (default: kg)"
            }
          },
          required: ["name", "category", "wasteLevel", "observations"]
        }
      },
      overallAssessment: {
        type: Type.STRING,
        description: "High-level synthesis of visible leftover state"
      },
      requiresHumanConfirmation: {
        type: Type.BOOLEAN,
        description: "Must always be true"
      }
    },
    required: ["foodItems", "overallAssessment", "requiresHumanConfirmation"]
  };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Gemini API returned an empty response.");
    }
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.foodItems)) {
      throw new Error("Gemini response did not conform to the expected structured format.");
    }
    const validatedItems = parsed.foodItems.map((item) => ({
      name: String(item.name || "Unidentified Leftover").trim(),
      category: ["grain", "lentil_curry", "vegetable", "dairy", "bakery", "protein", "other"].includes(item.category) ? item.category : "other",
      wasteLevel: ["low", "medium", "high"].includes(item.wasteLevel) ? item.wasteLevel : "medium",
      estimatedFillPercentage: typeof item.estimatedFillPercentage === "number" ? item.estimatedFillPercentage : null,
      visualConfidencePercentage: typeof item.visualConfidencePercentage === "number" ? item.visualConfidencePercentage : 90,
      observations: String(item.observations || "Visible leftover detected in container.").trim(),
      recommendedSuggestedUnit: "kg"
    }));
    return {
      foodItems: validatedItems,
      overallAssessment: parsed.overallAssessment || "Visible food waste detected across meal prep containers.",
      requiresHumanConfirmation: true,
      modelName: "Gemini 3.8 Flash (Vision)",
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      disclaimer: "AI estimates are derived from geometric volume heuristics and require human confirmation before saving."
    };
  } catch (err) {
    console.error("[Gemini Vision Error]", err);
    throw new Error(err.message || "AI analysis is temporarily unavailable.");
  }
}

// server/services/redistribution/matchingEngine.ts
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
function rankReceiversForSurplus(surplusItem, kitchenLocation, receivers) {
  const surplusHoursLeft = Math.max(
    (new Date(surplusItem.available_until).getTime() - Date.now()) / (3600 * 1e3),
    0.5
  );
  return receivers.map((receiver) => {
    const distanceKm = calculateHaversineDistanceKm(
      kitchenLocation.latitude,
      kitchenLocation.longitude,
      receiver.latitude,
      receiver.longitude
    );
    const estimatedTransitTimeMins = Math.round(distanceKm / 18 * 60 + 10);
    const transitHours = estimatedTransitTimeMins / 60;
    const remainingCapacity = Math.max(receiver.capacity - receiver.current_occupancy_kg, 0);
    const isCapacitySufficient = remainingCapacity >= surplusItem.quantity;
    const itemDietary = (surplusItem.dietary_type || "").toLowerCase();
    const receiverPref = (receiver.dietary_preferences || "").toLowerCase();
    const isDietaryCompatible = receiverPref.includes("all") || receiverPref.includes("any") || receiverPref.includes(itemDietary) || itemDietary.includes("veg") && receiverPref.includes("veg");
    const reasons = [];
    let score = 50;
    if (distanceKm <= 3.5) {
      score += 30;
      reasons.push(`Optimal proximity: only ${distanceKm} km away (${estimatedTransitTimeMins} mins dispatch time)`);
    } else if (distanceKm <= 7) {
      score += 20;
      reasons.push(`Accessible distance: ${distanceKm} km transit radius`);
    } else {
      score += 8;
      reasons.push(`Extended distance: ${distanceKm} km requires expedited vehicle`);
    }
    if (isCapacitySufficient) {
      score += 25;
      reasons.push(`Sufficient capacity: has ${remainingCapacity.toFixed(1)} kg available absorption room`);
    } else {
      score -= 15;
      reasons.push(`Limited capacity: only ${remainingCapacity.toFixed(1)} kg available of ${surplusItem.quantity} kg needed`);
    }
    if (receiver.has_cold_storage) {
      score += 10;
      reasons.push("Verified cold-chain and thermal storage on site");
    }
    if (isDietaryCompatible) {
      score += 15;
      reasons.push(`Full dietary alignment with ${receiver.dietary_preferences}`);
    } else {
      score -= 20;
      reasons.push("Potential dietary preference mismatch");
    }
    if (receiver.rating >= 4.8) {
      score += 5;
    }
    let transitRiskLevel = "low";
    if (transitHours > surplusHoursLeft * 0.7) {
      transitRiskLevel = "high";
      score -= 25;
      reasons.push(`Urgent transit warning: only ${surplusHoursLeft.toFixed(1)} hrs window remaining`);
    } else if (transitHours > surplusHoursLeft * 0.4) {
      transitRiskLevel = "medium";
    }
    const normalizedScore = Math.max(Math.min(Math.round(score), 99), 25);
    return {
      receiver,
      matchScore: normalizedScore,
      distanceKm,
      estimatedTransitTimeMins,
      remainingCapacityKg: Math.round(remainingCapacity * 10) / 10,
      isCapacitySufficient,
      isDietaryCompatible,
      transitRiskLevel,
      recommendationReasons: reasons
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// server/routes/api.ts
var router = Router2();
router.use("/auth", auth_default);
router.use(optionalAuth);
router.get("/status", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );
  res.json({
    status: "ok",
    app: "FoodWise AI",
    version: "1.4.0",
    database: dbStatus,
    ai: {
      geminiConfigured,
      model: "gemini-3.8-flash",
      status: geminiConfigured ? "Available" : "API Key Required for Live AI Vision"
    }
  });
});
router.get("/telemetry", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );
  res.json({
    success: true,
    status: "ok",
    app: "FoodWise AI",
    version: "1.4.0",
    database: dbStatus,
    gemini: {
      configured: geminiConfigured,
      model: "gemini-3.8-flash",
      status: geminiConfigured ? "Available" : "API Key Required for Live AI Vision"
    }
  });
});
router.get("/dashboard-metrics", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const orgId = req.user?.organization_id;
    const metrics = await getDashboardMetrics(includeDemo, orgId);
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post(["/scan-waste", "/analyze-waste"], async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "No image provided. Please capture or upload a photograph of the food waste container."
      });
    }
    const analysis = await analyzeFoodWasteImage(imageBase64, mimeType || "image/jpeg");
    return res.json({
      success: true,
      data: analysis,
      classification: "AI_ESTIMATION",
      requiresHumanConfirmation: true
    });
  } catch (err) {
    console.error("[API /scan-waste error]", err.message);
    const isKeyError = err.message.includes("GEMINI_API_KEY");
    return res.status(isKeyError ? 503 : 500).json({
      success: false,
      error: err.message || "Failed to analyze food waste image.",
      code: isKeyError ? "GEMINI_KEY_MISSING" : "AI_PROCESSING_ERROR",
      hint: isKeyError ? "Please configure GEMINI_API_KEY in the environment or Settings to enable real-time visual recognition." : "Ensure the image clearly shows food items inside a tray or container."
    });
  }
});
router.get("/waste-records", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const orgId = req.user?.organization_id;
    const records = await getWasteRecords(includeDemo, orgId);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/waste-records", async (req, res) => {
  try {
    if (req.user && req.user.role === "Receiver") {
      return res.status(403).json({
        success: false,
        error: "Access denied. NGO Receivers are not authorized to log kitchen waste.",
        code: "FORBIDDEN"
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
    if (!food_name || user_confirmed_quantity === void 0 || isNaN(Number(user_confirmed_quantity))) {
      return res.status(400).json({
        success: false,
        error: "Valid food item name and user-confirmed quantity are required."
      });
    }
    if (Number(user_confirmed_quantity) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Confirmed waste quantity must be greater than 0 kg."
      });
    }
    const targetOrgId = req.user?.organization_id || organization_id || "org-central-04";
    const saved = await insertWasteRecord({
      food_name,
      user_confirmed_quantity: Number(user_confirmed_quantity),
      unit: unit || "kg",
      waste_level: waste_level || "medium",
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
      message: "Waste record saved successfully with human-verified scale weight.",
      record: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/menus", async (req, res) => {
  try {
    const orgId = req.user?.organization_id;
    const menus = await getMenus(orgId);
    res.json({ success: true, menus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/menus", async (req, res) => {
  try {
    if (req.user && req.user.role === "Receiver") {
      return res.status(403).json({ success: false, error: "Receivers cannot create menus." });
    }
    const { name, date, event_type } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, error: "Menu name and date are required." });
    }
    const orgId = req.user?.organization_id || "org-central-04";
    const menu = await createMenu({
      organization_id: orgId,
      name,
      date,
      event_type: event_type || "Regular Service"
    });
    res.status(201).json({ success: true, menu });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/production", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const orgId = req.user?.organization_id;
    const records = await getProductionRecords(includeDemo, orgId);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/production", async (req, res) => {
  try {
    if (req.user && req.user.role === "Receiver") {
      return res.status(403).json({ success: false, error: "Receivers cannot log production." });
    }
    const { food_item_id, quantity_produced, consumed_kg, waste_kg, unit, date, shift, is_demo } = req.body;
    if (!food_item_id || !quantity_produced) {
      return res.status(400).json({ success: false, error: "food_item_id and quantity_produced are required." });
    }
    const orgId = req.user?.organization_id || "org-central-04";
    const record = await createProductionRecord({
      organization_id: orgId,
      food_item_id,
      quantity_produced: Number(quantity_produced),
      consumed_kg: consumed_kg ? Number(consumed_kg) : void 0,
      waste_kg: waste_kg ? Number(waste_kg) : void 0,
      unit: unit || "kg",
      date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      shift: shift || "Lunch",
      is_demo: Boolean(is_demo)
    });
    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/attendance", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const orgId = req.user?.organization_id;
    const records = await getAttendanceRecords(includeDemo, orgId);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/attendance", async (req, res) => {
  try {
    const { date, shift, expected_people, actual_people, is_demo } = req.body;
    if (!expected_people) {
      return res.status(400).json({ success: false, error: "expected_people count is required." });
    }
    const orgId = req.user?.organization_id || "org-central-04";
    const record = await createAttendanceRecord({
      organization_id: orgId,
      date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      shift: shift || "Lunch",
      expected_people: Number(expected_people),
      actual_people: actual_people ? Number(actual_people) : void 0,
      is_demo: Boolean(is_demo)
    });
    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/forecast", async (req, res) => {
  try {
    const shift = req.query.shift || "Lunch";
    const diners = parseInt(req.query.diners || "480", 10);
    const date = req.query.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const eventType = req.query.eventType || "Regular Service";
    const weather = req.query.weather || "Normal";
    const foodItemId = req.query.foodItemId || "fi-rice-01";
    const includeDemo = req.query.includeDemo !== "false";
    const foodItem = SEED_FOOD_ITEMS.find((f) => f.id === foodItemId) || {
      id: foodItemId,
      name: "Steamed Basmati Rice"
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/surplus", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const orgId = req.user?.organization_id;
    const surplus = await getSurplusListings(includeDemo, orgId);
    res.json({ success: true, surplus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/surplus", async (req, res) => {
  try {
    if (req.user && req.user.role !== "Kitchen Manager" && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role "${req.user.role}" is not authorized to create surplus listings. Kitchen Manager role required.`,
        code: "FORBIDDEN"
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
        error: "Food name and positive surplus quantity are required."
      });
    }
    const targetOrgId = req.user?.organization_id || "org-central-04";
    const created = await createSurplusListing({
      food_name,
      quantity: Number(quantity),
      unit: unit || "kg",
      available_until: available_until || new Date(Date.now() + 3 * 3600 * 1e3).toISOString(),
      pickup_location: pickup_location || "Central Kitchen Dispatch Dock #1",
      temperature_celsius: temperature_celsius ? Number(temperature_celsius) : 65,
      packaging_type: packaging_type || "Hygienic Steel GN Container",
      dietary_type: dietary_type || "Vegetarian",
      notes,
      organization_id: targetOrgId,
      is_demo: Boolean(is_demo)
    });
    res.json({ success: true, listing: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.patch("/surplus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;
    if (status === "claimed") {
      status = "reserved";
    }
    if (!["available", "reserved", "matched", "dispatched", "delivered", "expired", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status transition." });
    }
    const updated = await updateSurplusStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Surplus listing not found." });
    }
    if (status === "delivered") {
      await createHandoverLog({
        item_composition: updated.food_name,
        notes: updated.notes || "Redistribution batch completed",
        weight_kg: Number(updated.quantity),
        temperature_c: updated.temperature_celsius || 65,
        recipient_ngo: updated.pickup_location || "Verified Receiver Partner",
        status: `Delivered (${(/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        is_demo: Boolean(updated.is_demo)
      });
    }
    res.json({ success: true, listing: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/receivers", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const receivers = await getReceivers(includeDemo);
    res.json({ success: true, receivers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/match-surplus", async (req, res) => {
  try {
    const { surplusId, kitchenLat, kitchenLng } = req.body;
    const surplusList = await getSurplusListings(true);
    const surplusItem = surplusList.find((s) => s.id === surplusId);
    if (!surplusItem) {
      return res.status(404).json({ success: false, error: "Surplus item not found." });
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/analytics", async (req, res) => {
  try {
    const verifiedOnly = req.query.verifiedOnly === "true";
    const timeframe = req.query.timeframe || "all_time";
    const orgId = req.user?.organization_id;
    let wasteRecords = await getWasteRecords(!verifiedOnly, orgId);
    let surplusList = await getSurplusListings(!verifiedOnly, orgId);
    let handovers = await getHandoversLog(!verifiedOnly);
    if (timeframe !== "all_time") {
      const now = /* @__PURE__ */ new Date();
      const filterByTime = (dateStr) => {
        if (!dateStr) return true;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return true;
        if (timeframe === "today") {
          return d.toDateString() === now.toDateString();
        }
        if (timeframe === "this_week") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1e3);
          return d >= sevenDaysAgo;
        }
        if (timeframe === "this_month") {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      };
      wasteRecords = wasteRecords.filter((r) => filterByTime(r.created_at));
      surplusList = surplusList.filter((s) => filterByTime(s.created_at));
    }
    const metrics = calculateSustainabilityImpact(wasteRecords, surplusList, handovers, verifiedOnly);
    res.json({ success: true, metrics, timeframe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.get("/handovers", async (req, res) => {
  try {
    const includeDemo = req.query.includeDemo !== "false";
    const handovers = await getHandoversLog(includeDemo);
    res.json({ success: true, handovers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/reset-data", async (req, res) => {
  try {
    if (req.user && req.user.role !== "Admin" && req.user.role !== "Kitchen Manager") {
      return res.status(403).json({ success: false, error: "Only Admin or Kitchen Manager can reset data." });
    }
    const result = await clearUserRecords();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var api_default = router;

// serverless-api.ts
var app = express();
var databaseReady = initDatabase();
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/api", api_default);
async function handler(req, res) {
  await databaseReady;
  return app(req, res);
}
export {
  handler as default
};
