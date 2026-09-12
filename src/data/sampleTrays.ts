// Pre-packaged test food waste trays for immediate camera testing without physical webcam

export interface SampleTray {
  id: string;
  name: string;
  category: 'grain' | 'lentil_curry' | 'vegetable' | 'bakery';
  description: string;
  typicalWeightKg: number;
  dataUrl: string;
}

// Generate high-contrast SVG representations converted to base64 data URLs
function createTrayDataUrl(bgColor: string, foodName: string, containerType: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#141B2B" />
    <rect x="40" y="40" width="520" height="370" rx="24" fill="#1E293B" stroke="#334155" stroke-width="4" />
    <rect x="60" y="60" width="480" height="330" rx="16" fill="${bgColor}" opacity="0.9" />
    <!-- Tray grid lines simulating institutional steam table GN 1/1 container -->
    <line x1="60" y1="225" x2="540" y2="225" stroke="#FFFFFF" stroke-opacity="0.15" stroke-dasharray="6,6" />
    <line x1="300" y1="60" x2="300" y2="390" stroke="#FFFFFF" stroke-opacity="0.15" stroke-dasharray="6,6" />
    <!-- Visual food texture marks -->
    <circle cx="150" cy="140" r="35" fill="#FFFFFF" fill-opacity="0.1" />
    <circle cx="420" cy="180" r="45" fill="#FFFFFF" fill-opacity="0.1" />
    <circle cx="260" cy="290" r="40" fill="#FFFFFF" fill-opacity="0.1" />
    <circle cx="390" cy="310" r="30" fill="#FFFFFF" fill-opacity="0.1" />
    <!-- Labels -->
    <rect x="80" y="80" width="220" height="36" rx="6" fill="#000000" fill-opacity="0.6" />
    <text x="95" y="104" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">${containerType}</text>
    <rect x="80" y="320" width="340" height="50" rx="8" fill="#000000" fill-opacity="0.75" />
    <text x="95" y="352" font-family="sans-serif" font-size="20" font-weight="bold" fill="#82F5C1">${foodName}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const SAMPLE_TRAYS: SampleTray[] = [
  {
    id: 'sample-rice',
    name: 'Steamed Basmati Rice (GN 1/1 Steam Table)',
    category: 'grain',
    description: 'Stainless steel steam table pan with ~65% remaining cooked white rice.',
    typicalWeightKg: 3.4,
    dataUrl: createTrayDataUrl('#D4D4D8', 'Leftover Steamed Rice', 'Steam Table Tray #2')
  },
  {
    id: 'sample-dal',
    name: 'Yellow Dal Tadka (Soup Well)',
    category: 'lentil_curry',
    description: 'Round bain-marie insert containing simmered yellow lentil curry.',
    typicalWeightKg: 2.1,
    dataUrl: createTrayDataUrl('#EAB308', 'Dal Tadka Residue', 'Bain-Marie Well #4')
  },
  {
    id: 'sample-subzi',
    name: 'Mixed Seasonal Vegetable Sabzi',
    category: 'vegetable',
    description: 'Gastro tray containing cooked beans, carrots, and peas leftover from service.',
    typicalWeightKg: 1.9,
    dataUrl: createTrayDataUrl('#15803D', 'Mixed Vegetable Sabzi', 'Main Line Tray #1')
  },
  {
    id: 'sample-roti',
    name: 'Whole Wheat Chapati & Roti Warmer',
    category: 'bakery',
    description: 'Insulated warmer with stacked whole wheat flatbreads.',
    typicalWeightKg: 2.6,
    dataUrl: createTrayDataUrl('#B45309', 'Whole Wheat Roti Stack', 'Bakery Warmer #3')
  }
];
