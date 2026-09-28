import { get } from './apiClient.ts';
import type { SustainabilityMetrics } from '../types.ts';

export function getAnalytics(input: {
  timeframe: string;
  verifiedOnly: boolean;
}) {
  const query = new URLSearchParams({
    timeframe: input.timeframe,
    verifiedOnly: String(input.verifiedOnly)
  });

  return get<{ success: true; metrics: SustainabilityMetrics; timeframe: string }>(
    `/api/analytics?${query.toString()}`
  );
}
