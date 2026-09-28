import { get, patch, post } from './apiClient.ts';
import type { SurplusListing } from '../types.ts';

export function listSurplus(includeDemo: boolean) {
  return get<{ success: true; surplus: SurplusListing[] }>(`/api/surplus?includeDemo=${includeDemo}`);
}

export interface NewSurplusListing {
  food_name: string;
  quantity: number;
  unit: string;
  available_until: string;
  pickup_location: string;
  temperature_celsius?: number;
  packaging_type?: string;
  dietary_type?: string;
  notes?: string;
  is_demo: false;
}

export function createSurplus(input: NewSurplusListing) {
  return post<{ success: true; listing: SurplusListing }>('/api/surplus', input);
}

export function updateSurplusStatus(id: string, status: string) {
  return patch<{ success: true; listing: SurplusListing }>(`/api/surplus/${id}`, { status });
}

export function completeSurplusHandover(input: {
  id: string;
  weightKg: number;
  temperatureCelsius: number;
  receiverName: string;
  notes: string;
}) {
  return patch<{ success: true; listing: SurplusListing }>(`/api/surplus/${input.id}`, {
    status: 'delivered',
    weight_kg: input.weightKg,
    temperature_celsius: input.temperatureCelsius,
    recipient_ngo: input.receiverName,
    notes: input.notes
  });
}
