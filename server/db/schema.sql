-- FoodWise AI PostgreSQL Schema
-- Institutional Kitchen Food Waste Reduction & Sustainable Redistribution Ecosystem

CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL, -- 'institutional_kitchen', 'ngo_shelter', 'food_bank', 'community_kitchen'
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone VARCHAR(32),
    fssai_license VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL, -- 'Kitchen Manager', 'Kitchen Staff', 'Receiver', 'Admin'
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_items (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'grain', 'lentil_curry', 'vegetable', 'dairy', 'bakery', 'protein'
    default_unit VARCHAR(16) DEFAULT 'kg',
    shelf_life_hours INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    event_type VARCHAR(64) DEFAULT 'Regular Service', -- 'Regular Service', 'Exam Week', 'Banquet', 'Festival'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(32) DEFAULT 'Lunch', -- 'Breakfast', 'Lunch', 'Dinner'
    expected_people INTEGER NOT NULL,
    actual_people INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_records (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    food_item_id VARCHAR(64) REFERENCES food_items(id) ON DELETE CASCADE,
    menu_id VARCHAR(64) REFERENCES menus(id) ON DELETE SET NULL,
    quantity_produced DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    date DATE NOT NULL,
    shift VARCHAR(32) DEFAULT 'Lunch',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consumption_records (
    id VARCHAR(64) PRIMARY KEY,
    production_record_id VARCHAR(64) REFERENCES production_records(id) ON DELETE CASCADE,
    quantity_consumed DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waste_records (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    food_item_id VARCHAR(64) REFERENCES food_items(id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL,
    image_url TEXT,
    ai_analysis_json JSONB,
    user_confirmed_quantity DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    waste_level VARCHAR(32), -- 'low', 'medium', 'high'
    service_shift VARCHAR(32) DEFAULT 'Lunch',
    station_name VARCHAR(128) DEFAULT 'Prep Station',
    notes TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demand_predictions (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    food_item_id VARCHAR(64) REFERENCES food_items(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    shift VARCHAR(32) DEFAULT 'Lunch',
    expected_diners INTEGER NOT NULL,
    expected_demand DOUBLE PRECISION NOT NULL,
    expected_waste DOUBLE PRECISION NOT NULL,
    recommended_production DOUBLE PRECISION NOT NULL,
    model_name VARCHAR(128) DEFAULT 'FoodWise-Ensemble-v4.2',
    confidence DOUBLE PRECISION NOT NULL,
    factors_json JSONB,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surplus_listings (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    food_item_id VARCHAR(64) REFERENCES food_items(id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    unit VARCHAR(16) DEFAULT 'kg',
    prep_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    available_until TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_location TEXT NOT NULL,
    temperature_celsius DOUBLE PRECISION,
    packaging_type VARCHAR(128) DEFAULT 'Sealed Gastronorm GN 1/1',
    dietary_type VARCHAR(64) DEFAULT 'Vegetarian',
    status VARCHAR(32) DEFAULT 'available', -- 'available', 'matched', 'dispatched', 'delivered', 'expired'
    notes TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receivers (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) DEFAULT 'NGO Shelter',
    capacity DOUBLE PRECISION NOT NULL, -- Daily capacity in kg
    current_occupancy_kg DOUBLE PRECISION DEFAULT 0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(128),
    contact_phone VARCHAR(32),
    dietary_preferences TEXT,
    has_cold_storage BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT TRUE,
    rating DOUBLE PRECISION DEFAULT 4.8,
    total_logs INTEGER DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redistribution_matches (
    id VARCHAR(64) PRIMARY KEY,
    surplus_listing_id VARCHAR(64) REFERENCES surplus_listings(id) ON DELETE CASCADE,
    receiver_id VARCHAR(64) REFERENCES receivers(id) ON DELETE CASCADE,
    match_score DOUBLE PRECISION NOT NULL, -- 0 to 100
    distance_km DOUBLE PRECISION NOT NULL,
    estimated_travel_time_mins INTEGER NOT NULL,
    transit_temperature_celsius DOUBLE PRECISION,
    courier_details VARCHAR(255),
    status VARCHAR(32) DEFAULT 'matched', -- 'matched', 'accepted', 'dispatched', 'delivered', 'rejected'
    delivery_timestamp TIMESTAMP WITH TIME ZONE,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS impact_records (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    food_saved DOUBLE PRECISION NOT NULL,
    waste_reduced DOUBLE PRECISION NOT NULL,
    meals_equivalent INTEGER NOT NULL,
    estimated_environmental_impact JSONB NOT NULL, -- co2_avoided_kg, water_saved_liters, cost_saved_inr
    methodology TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
