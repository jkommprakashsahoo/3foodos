// FoodWise AI Frontend Types

export type UserRole = 'Kitchen Manager' | 'Kitchen Staff' | 'Receiver' | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
}

export interface DatabaseTelemetry {
  connected: boolean;
  engine: 'PostgreSQL' | 'Local Embedded Store';
  databaseUrlConfigured: boolean;
  message: string;
  tablesReady: boolean;
  totalVerifiedWasteRecords: number;
  totalDemoWasteRecords: number;
}

export interface SystemStatus {
  status: string;
  app: string;
  version: string;
  database: DatabaseTelemetry;
  ai: {
    geminiConfigured: boolean;
    model: string;
    status: string;
  };
}

export interface DetectedFoodWasteItem {
  name: string;
  category: 'grain' | 'lentil_curry' | 'vegetable' | 'dairy' | 'bakery' | 'protein' | 'other';
  wasteLevel: 'low' | 'medium' | 'high';
  estimatedFillPercentage: number | null;
  visualConfidencePercentage: number;
  observations: string;
  recommendedSuggestedUnit: string;
}

export interface WasteScanResult {
  foodItems: DetectedFoodWasteItem[];
  overallAssessment: string;
  requiresHumanConfirmation: boolean;
  modelName: string;
  analyzedAt: string;
  disclaimer: string;
}

export interface WasteRecord {
  id: string;
  organization_id?: string;
  food_name: string;
  user_confirmed_quantity: number;
  unit: string;
  waste_level: 'low' | 'medium' | 'high';
  image_url?: string | null;
  ai_analysis_json?: any;
  notes?: string;
  service_shift: string;
  station_name: string;
  is_demo: boolean;
  created_at: string;
}

export interface ForecastFactor {
  factor: string;
  impact_kg: number;
  weight_percentage: number;
  description: string;
  direction: 'increase' | 'decrease' | 'neutral';
}

export interface DemandForecastData {
  hasSufficientData: boolean;
  message?: string;
  foodItemId: string;
  foodName: string;
  predictionDate: string;
  shift: string;
  expectedDiners: number;
  baselineDemandKg: number;
  adjustedDemandKg: number;
  recommendedProductionKg: number;
  confidenceScore: number;
  bufferMarginKg: number;
  expectedWasteRangeKg: { min: number; max: number };
  factors: ForecastFactor[];
  modelDetails: {
    algorithm: string;
    historicalRecordsUsed: number;
    trainingWindowDays: number;
  };
}

export interface SurplusListing {
  id: string;
  organization_id?: string;
  food_item_id?: string;
  food_name: string;
  quantity: number;
  unit: string;
  prep_timestamp: string;
  available_until: string;
  pickup_location: string;
  temperature_celsius?: number;
  packaging_type: string;
  dietary_type: string;
  status: 'available' | 'matched' | 'dispatched' | 'delivered' | 'expired';
  notes?: string;
  is_demo: boolean;
  created_at?: string;
}

export interface Receiver {
  id: string;
  name: string;
  type: string;
  capacity: number;
  current_occupancy_kg: number;
  latitude: number;
  longitude: number;
  address: string;
  contact_person: string;
  contact_phone: string;
  dietary_preferences: string;
  has_cold_storage: boolean;
  verified: boolean;
  rating: number;
  total_logs: number;
  is_demo?: boolean;
}

export interface MatchRecommendation {
  receiver: Receiver;
  matchScore: number;
  distanceKm: number;
  estimatedTransitTimeMins: number;
  remainingCapacityKg: number;
  isCapacitySufficient: boolean;
  isDietaryCompatible: boolean;
  transitRiskLevel: 'low' | 'medium' | 'high';
  recommendationReasons: string[];
}

export interface SustainabilityMetrics {
  foodSavedKg: number;
  wasteReducedKg: number;
  mealsEquivalent: number;
  avoidedCo2eKg: number;
  waterSavedLiters: number;
  financialSavingsInr: number;
  totalLogsCount: number;
  dataClassification: 'ALL_DATA' | 'VERIFIED_ONLY';
  methodology: {
    mealConversionFormula: string;
    co2eEmissionFactor: string;
    waterFootprintFactor: string;
    financialCostFactor: string;
    sourceReferences: string[];
  };
  shiftBreakdown: Array<{
    shift: string;
    wasteKg: number;
    divertedKg: number;
  }>;
  weeklyTrend: Array<{
    day: string;
    wasteKg: number;
    divertedKg: number;
  }>;
}

export interface HandoverRecord {
  id: string;
  item_composition: string;
  notes: string;
  weight_kg: number;
  temperature_c: number;
  recipient_ngo: string;
  status: string;
  timestamp: string;
  is_demo: boolean;
}
