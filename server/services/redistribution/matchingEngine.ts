// FoodWise AI - Algorithmic Surplus Matching & Route Logistics Engine

export interface ReceiverProfile {
  id: string;
  name: string;
  type: string;
  capacity: number; // kg daily
  current_occupancy_kg: number;
  latitude: number;
  longitude: number;
  address: string;
  contact_person?: string;
  contact_phone?: string;
  dietary_preferences?: string;
  has_cold_storage?: boolean;
  verified?: boolean;
  rating?: number;
  total_logs?: number;
  is_demo?: boolean;
}

export interface MatchRecommendation {
  receiver: ReceiverProfile;
  matchScore: number; // 0 to 100
  distanceKm: number;
  estimatedTransitTimeMins: number;
  remainingCapacityKg: number;
  isCapacitySufficient: boolean;
  isDietaryCompatible: boolean;
  transitRiskLevel: 'low' | 'medium' | 'high';
  recommendationReasons: string[];
}

// Calculate Haversine distance in kilometers between two GPS coordinates
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function rankReceiversForSurplus(
  surplusItem: {
    id: string;
    food_name: string;
    quantity: number;
    dietary_type?: string;
    packaging_type?: string;
    available_until: string;
    temperature_celsius?: number;
  },
  kitchenLocation: { latitude: number; longitude: number },
  receivers: ReceiverProfile[]
): MatchRecommendation[] {
  const surplusHoursLeft = Math.max(
    (new Date(surplusItem.available_until).getTime() - Date.now()) / (3600 * 1000),
    0.5
  );

  return receivers.map(receiver => {
    const distanceKm = calculateHaversineDistanceKm(
      kitchenLocation.latitude,
      kitchenLocation.longitude,
      receiver.latitude,
      receiver.longitude
    );

    // Urban transit calculation: ~18 km/h avg speed + 10 mins loading buffer
    const estimatedTransitTimeMins = Math.round((distanceKm / 18) * 60 + 10);
    const transitHours = estimatedTransitTimeMins / 60;

    const remainingCapacity = Math.max(receiver.capacity - receiver.current_occupancy_kg, 0);
    const isCapacitySufficient = remainingCapacity >= surplusItem.quantity;

    // Check dietary compatibility
    const itemDietary = (surplusItem.dietary_type || '').toLowerCase();
    const receiverPref = (receiver.dietary_preferences || '').toLowerCase();
    const isDietaryCompatible =
      receiverPref.includes('all') ||
      receiverPref.includes('any') ||
      receiverPref.includes(itemDietary) ||
      (itemDietary.includes('veg') && receiverPref.includes('veg'));

    const reasons: string[] = [];
    let score = 50;

    // Distance scoring (closer is better, max 30 points)
    if (distanceKm <= 3.5) {
      score += 30;
      reasons.push(`Optimal proximity: only ${distanceKm} km away (${estimatedTransitTimeMins} mins dispatch time)`);
    } else if (distanceKm <= 7.0) {
      score += 20;
      reasons.push(`Accessible distance: ${distanceKm} km transit radius`);
    } else {
      score += 8;
      reasons.push(`Extended distance: ${distanceKm} km requires expedited vehicle`);
    }

    // Capacity scoring (max 30 points)
    if (isCapacitySufficient) {
      score += 25;
      reasons.push(`Sufficient capacity: has ${remainingCapacity.toFixed(1)} kg available absorption room`);
    } else {
      score -= 15;
      reasons.push(`Limited capacity: only ${remainingCapacity.toFixed(1)} kg available of ${surplusItem.quantity} kg needed`);
    }

    // Cold storage / Temperature safety scoring
    if (receiver.has_cold_storage) {
      score += 10;
      reasons.push('Verified cold-chain and thermal storage on site');
    }

    // Dietary match
    if (isDietaryCompatible) {
      score += 15;
      reasons.push(`Full dietary alignment with ${receiver.dietary_preferences}`);
    } else {
      score -= 20;
      reasons.push('Potential dietary preference mismatch');
    }

    // Reliability & rating bonus
    if (receiver.rating >= 4.8) {
      score += 5;
    }

    // Transit risk level
    let transitRiskLevel: 'low' | 'medium' | 'high' = 'low';
    if (transitHours > surplusHoursLeft * 0.7) {
      transitRiskLevel = 'high';
      score -= 25;
      reasons.push(`Urgent transit warning: only ${surplusHoursLeft.toFixed(1)} hrs window remaining`);
    } else if (transitHours > surplusHoursLeft * 0.4) {
      transitRiskLevel = 'medium';
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
