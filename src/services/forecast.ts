import { get, post } from './apiClient.ts';
import type { DemandForecastData } from '../types.ts';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  shelf_life_hours?: number;
}

export function getForecast(input: {
  date: string;
  shift: string;
  diners: number;
  eventType: string;
  weather: string;
  foodItemId: string;
  includeDemo: boolean;
}) {
  const query = new URLSearchParams({
    date: input.date,
    shift: input.shift,
    diners: String(input.diners),
    eventType: input.eventType,
    weather: input.weather,
    foodItemId: input.foodItemId,
    includeDemo: String(input.includeDemo)
  });

  return get<{ success: true; data: DemandForecastData }>(`/api/forecast?${query.toString()}`);
}

export function listFoodItems() {
  return get<{ success: true; foodItems: FoodItem[] }>('/api/food-items');
}

export function createProductionRecord(input: {
  food_item_id: string;
  quantity_produced: number;
  unit: string;
  date: string;
  shift: string;
  is_demo: false;
}) {
  return post<{ success: true; record: unknown }>('/api/production', input);
}
