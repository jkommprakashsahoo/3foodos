import { get } from './apiClient.ts';
import type { DatabaseTelemetry, SurplusListing, WasteRecord } from '../types.ts';

export interface DashboardMetrics {
  hasData: boolean;
  totalFoodProducedKg: number;
  totalFoodConsumedKg: number;
  totalFoodWastedKg: number;
  totalFoodSavedKg: number;
  redistributionBatchesCount: number;
  redistributionKg: number;
  wasteRatePercentage: number | null;
  totalVerifiedWasteLogs: number;
  recentHandovers: Array<{
    lot: string;
    item: string;
    qty: string;
    recipient: string;
    eta: string;
    status: string;
  }>;
}

export interface ProductionRecord {
  id: string;
  organization_id: string;
  food_item_id: string;
  quantity_produced: number;
  consumed_kg?: number;
  waste_kg?: number;
  unit: string;
  date: string;
  shift: string;
  is_demo?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  shift: string;
  expected_people: number;
  actual_people?: number;
  is_demo?: boolean;
}

export function getTelemetry() {
  return get<{
    success: true;
    database: DatabaseTelemetry;
    gemini: { configured: boolean; model: string; status: string };
  }>('/api/telemetry');
}

export function getDashboardMetrics(includeDemo: boolean) {
  return get<{ success: true; metrics: DashboardMetrics }>(
    `/api/dashboard-metrics?includeDemo=${includeDemo}`
  );
}

export function listProduction(includeDemo: boolean) {
  return get<{ success: true; records: ProductionRecord[] }>(
    `/api/production?includeDemo=${includeDemo}`
  );
}

export function listAttendance(includeDemo: boolean) {
  return get<{ success: true; records: AttendanceRecord[] }>(
    `/api/attendance?includeDemo=${includeDemo}`
  );
}

export function getAppData(includeDemo: boolean) {
  return Promise.all([
    getTelemetry(),
    getDashboardMetrics(includeDemo),
    get<{ success: true; records: WasteRecord[] }>(`/api/waste-records?includeDemo=${includeDemo}`),
    get<{ success: true; surplus: SurplusListing[] }>(`/api/surplus?includeDemo=${includeDemo}`)
  ]);
}
