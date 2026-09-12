// Seed data for FoodWise AI
// Cleanly demarcated into DEMO DATA vs verified structure

export const SEED_ORGANIZATIONS = [
  {
    id: 'org-central-04',
    name: 'Campus Central Kitchen #04',
    type: 'institutional_kitchen',
    address: 'Bandra Kurla Complex, Institutional Block C, Mumbai, Maharashtra 400051',
    latitude: 19.0657,
    longitude: 72.8687,
    contact_phone: '+91 22 6123 4567',
    fssai_license: 'FSSAI-11519024000889'
  }
];

export const SEED_USERS = [
  {
    id: 'usr-arjun-01',
    name: 'Arjun Rao',
    email: 'arjun.rao@foodwise.org',
    password_hash: '$2b$10$demo_hash_arjun_password_verified',
    role: 'Kitchen Manager',
    organization_id: 'org-central-04'
  },
  {
    id: 'usr-priya-02',
    name: 'Priya Sharma',
    email: 'priya.sharma@foodwise.org',
    password_hash: '$2b$10$demo_hash_priya_staff_password',
    role: 'Kitchen Staff',
    organization_id: 'org-central-04'
  },
  {
    id: 'usr-sunil-03',
    name: 'Sunil Mehta',
    email: 'sunil@ashashelter.org',
    password_hash: '$2b$10$demo_hash_sunil_receiver_password',
    role: 'Receiver',
    organization_id: 'org-central-04'
  },
  {
    id: 'usr-admin-04',
    name: 'Chief Admin',
    email: 'admin@foodwise.org',
    password_hash: '$2b$10$demo_hash_admin_secret',
    role: 'Admin',
    organization_id: 'org-central-04'
  }
];

export const SEED_FOOD_ITEMS = [
  { id: 'fi-rice-01', name: 'Steamed Basmati Rice', category: 'grain', default_unit: 'kg', shelf_life_hours: 4 },
  { id: 'fi-dal-02', name: 'Yellow Dal Tadka', category: 'lentil_curry', default_unit: 'kg', shelf_life_hours: 4 },
  { id: 'fi-subzi-03', name: 'Mixed Subzi Greens', category: 'vegetable', default_unit: 'kg', shelf_life_hours: 4 },
  { id: 'fi-roti-04', name: 'Whole Wheat Chapati & Roti', category: 'bakery', default_unit: 'kg', shelf_life_hours: 6 },
  { id: 'fi-biryani-05', name: 'Vegetable Biryani & Raita', category: 'grain', default_unit: 'kg', shelf_life_hours: 4 },
  { id: 'fi-paneer-06', name: 'Paneer Makhani', category: 'protein', default_unit: 'kg', shelf_life_hours: 4 }
];

export const SEED_RECEIVERS = [
  {
    id: 'rec-asha-01',
    organization_id: 'org-central-04',
    name: "Asha Community Kitchen & Children's Shelter",
    type: 'NGO Shelter',
    capacity: 45.0, // kg per day
    current_occupancy_kg: 17.0,
    latitude: 19.0435,
    longitude: 72.8422,
    address: 'Mahim West, Near Railway Colony, Mumbai 400016',
    contact_person: 'Sunil Mehta (Center Head)',
    contact_phone: '+91 98201 44552',
    dietary_preferences: 'Strict Vegetarian • No Peanuts',
    has_cold_storage: true,
    verified: true,
    rating: 4.9,
    total_logs: 312,
    is_demo: true
  },
  {
    id: 'rec-robin-02',
    organization_id: 'org-central-04',
    name: 'Robin Hood Army - South Ward Chapter',
    type: 'Volunteer Food Rescue',
    capacity: 60.0,
    current_occupancy_kg: 24.0,
    latitude: 19.0178,
    longitude: 72.8300,
    address: 'Dadar Community Center, Mumbai 400028',
    contact_person: 'Kavita Iyer (Dispatch Lead)',
    contact_phone: '+91 98192 33410',
    dietary_preferences: 'All Edible Cooked Food',
    has_cold_storage: false,
    verified: true,
    rating: 4.8,
    total_logs: 489,
    is_demo: true
  },
  {
    id: 'rec-pratham-03',
    organization_id: 'org-central-04',
    name: 'Pratham Meal Care & Night Shelter',
    type: 'Night Shelter',
    capacity: 35.0,
    current_occupancy_kg: 12.0,
    latitude: 19.0324,
    longitude: 72.8592,
    address: 'Sion East, Near Circle Garden, Mumbai 400022',
    contact_person: 'Dr. Rajesh Patel',
    contact_phone: '+91 98330 11982',
    dietary_preferences: 'Lentils, Rice, Breads',
    has_cold_storage: true,
    verified: true,
    rating: 4.9,
    total_logs: 204,
    is_demo: true
  }
];

export const SEED_HISTORICAL_RECORDS = [
  // 7 days of historical shift records for baseline calculations
  { date: '2026-09-05', shift: 'Lunch', expected_diners: 480, actual_diners: 472, produced_kg: 102.5, consumed_kg: 92.0, waste_kg: 10.5, is_demo: true },
  { date: '2026-09-06', shift: 'Lunch', expected_diners: 490, actual_diners: 485, produced_kg: 104.0, consumed_kg: 94.2, waste_kg: 9.8, is_demo: true },
  { date: '2026-09-07', shift: 'Lunch', expected_diners: 450, actual_diners: 442, produced_kg: 96.0, consumed_kg: 86.8, waste_kg: 9.2, is_demo: true },
  { date: '2026-09-08', shift: 'Lunch', expected_diners: 510, actual_diners: 504, produced_kg: 108.0, consumed_kg: 98.4, waste_kg: 9.6, is_demo: true },
  { date: '2026-09-09', shift: 'Lunch', expected_diners: 500, actual_diners: 492, produced_kg: 105.0, consumed_kg: 96.2, waste_kg: 8.8, is_demo: true },
  { date: '2026-09-10', shift: 'Lunch', expected_diners: 490, actual_diners: 480, produced_kg: 103.0, consumed_kg: 92.8, waste_kg: 10.2, is_demo: true },
  { date: '2026-09-11', shift: 'Lunch', expected_diners: 430, actual_diners: 424, produced_kg: 98.4, consumed_kg: 90.0, waste_kg: 8.4, is_demo: true }
];

export const SEED_RECENT_WASTE_LOGS = [
  {
    id: 'wr-seed-01',
    food_name: 'Steamed Basmati Rice',
    quantity: 3.2,
    unit: 'kg',
    waste_level: 'high',
    service_shift: 'Lunch',
    station_name: 'Station #2 AI Scale',
    notes: 'End of lunch steam table residue. High grain moisture preserved.',
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString()
  },
  {
    id: 'wr-seed-02',
    food_name: 'Mixed Subzi Greens',
    quantity: 2.0,
    unit: 'kg',
    waste_level: 'medium',
    service_shift: 'Lunch',
    station_name: 'Main Prep Line 4',
    notes: 'Tray trim and line clearance.',
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  },
  {
    id: 'wr-seed-03',
    food_name: 'Yellow Dal Tadka',
    quantity: 1.4,
    unit: 'kg',
    waste_level: 'medium',
    service_shift: 'Lunch',
    station_name: 'Station #2 AI Scale',
    notes: 'Bain-marie bottom volume.',
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString()
  },
  {
    id: 'wr-seed-04',
    food_name: 'Whole Wheat Chapati & Roti',
    quantity: 1.8,
    unit: 'kg',
    waste_level: 'low',
    service_shift: 'Lunch',
    station_name: 'Bakery Station #3',
    notes: 'Dry bread warming container holding time exceeded.',
    is_demo: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  }
];

export const SEED_SURPLUS_LISTINGS = [
  {
    id: 'surplus-01',
    food_item_id: 'fi-biryani-05',
    food_name: 'Fresh Vegetable Biryani & Raita',
    quantity: 12.0,
    unit: 'kg',
    prep_timestamp: new Date(Date.now() - 3600 * 1000 * 1.25).toISOString(),
    available_until: new Date(Date.now() + 3600 * 1000 * 1.25).toISOString(),
    pickup_location: 'Central Kitchen - Bay 2 Loading Dock',
    temperature_celsius: 68.0,
    packaging_type: 'Hygienic Steel Sealed (GN 1/1)',
    dietary_type: '100% Vegetarian',
    status: 'matched',
    notes: 'Cooked fresh at 12:15 PM. Hot holding temperature verified compliant.',
    is_demo: true
  },
  {
    id: 'surplus-02',
    food_item_id: 'fi-roti-04',
    food_name: 'Whole Wheat Chapati & Steamed Rice',
    quantity: 6.5,
    unit: 'kg',
    prep_timestamp: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString(),
    available_until: new Date(Date.now() + 3600 * 1000 * 3.5).toISOString(),
    pickup_location: 'Bakery & Grain Station #3',
    temperature_celsius: 54.0,
    packaging_type: 'Insulated Dry Pack Foil Wrapped',
    dietary_type: 'Vegetarian',
    status: 'available',
    notes: 'Pantry clean batch. Ready for immediate pickup.',
    is_demo: true
  }
];

export const SEED_HANDOVERS_LOG = [
  {
    id: 'lot-8921-a',
    item_composition: 'Dal Makhani & Jeera Rice',
    notes: 'Cooked 11:30 AM • High Protein',
    weight_kg: 14.2,
    temperature_c: 66.0,
    recipient_ngo: 'Pratham Meal Shelter - Dadar',
    status: 'Delivered (12:45 PM)',
    timestamp: '12:45 PM',
    is_demo: true
  },
  {
    id: 'lot-8919-c',
    item_composition: 'Assorted Idli & Sambhar Batches',
    notes: 'Breakfast Surplus • Steamed',
    weight_kg: 9.8,
    temperature_c: 62.0,
    recipient_ngo: 'Seva Sadan Youth Home',
    status: 'Delivered (10:15 AM)',
    timestamp: '10:15 AM',
    is_demo: true
  },
  {
    id: 'lot-8918-b',
    item_composition: 'Whole Wheat Sandwiches (Cold Pack)',
    notes: 'Cafeteria Grab-and-go sealed',
    weight_kg: 5.5,
    temperature_c: 4.2,
    recipient_ngo: 'Robin Hood Army - South Ward',
    status: 'Delivered (9:40 AM)',
    timestamp: '09:40 AM',
    is_demo: true
  }
];
