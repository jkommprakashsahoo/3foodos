import { get, post } from './apiClient.ts';
import type { WasteRecord, WasteScanResult } from '../types.ts';

export function listWasteRecords(includeDemo: boolean) {
  return get<{ success: true; records: WasteRecord[] }>(
    `/api/waste-records?includeDemo=${includeDemo}`
  );
}

export function analyzeWasteImage(imageBase64: string, mimeType: string) {
  return post<{
    success: true;
    data: WasteScanResult;
    classification: string;
    requiresHumanConfirmation: true;
  }>('/api/scan-waste', { imageBase64, mimeType });
}

export interface NewWasteRecord {
  food_name: string;
  user_confirmed_quantity: number;
  unit: string;
  waste_level: 'low' | 'medium' | 'high';
  image_url?: string | null;
  ai_analysis_json?: WasteScanResult | null;
  notes?: string;
  service_shift: string;
  station_name: string;
  is_demo: false;
}

export function createWasteRecord(input: NewWasteRecord) {
  return post<{ success: true; record: WasteRecord; message: string }>('/api/waste-records', input);
}
