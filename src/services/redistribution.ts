import { get, patch, post } from './apiClient.ts';
import type { MatchRecommendation, Receiver, RedistributionAssignment, SurplusListing } from '../types.ts';

export function listReceivers(includeDemo: boolean) {
  return get<{ success: true; receivers: Receiver[] }>(`/api/receivers?includeDemo=${includeDemo}`);
}

export function getSurplusMatches(input: {
  surplusId: string;
  kitchenLat?: number;
  kitchenLng?: number;
  includeDemo?: boolean;
}) {
  return post<{
    success: true;
    surplusItem: SurplusListing;
    matches: MatchRecommendation[];
  }>('/api/match-surplus', input);
}

export function listRedistribution(includeDemo: boolean) {
  return get<{
    success: true;
    matches: RedistributionAssignment[];
    receivers: Receiver[];
  }>(`/api/redistribution?includeDemo=${includeDemo}`);
}

export function assignSurplus(input: {
  surplusId: string;
  receiverId: string;
  kitchenLat: number;
  kitchenLng: number;
  includeDemo: boolean;
}) {
  return post<{
    success: true;
    match: RedistributionAssignment;
    recommendation: MatchRecommendation;
  }>('/api/redistribution/assign', input);
}

export function updateRedistributionStatus(
  id: string,
  status: RedistributionAssignment['status'],
  details?: {
    temperatureCelsius?: number;
    handoverWeightKg?: number;
    handoverNotes?: string;
  }
) {
  return patch<{ success: true; match: RedistributionAssignment }>(
    `/api/redistribution/${id}/status`,
    { status, ...details }
  );
}

export function listHandovers(includeDemo: boolean) {
  return get<{ success: true; handovers: import('../types.ts').HandoverRecord[] }>(
    `/api/handovers?includeDemo=${includeDemo}`
  );
}
