// FoodWise AI Interactive Vector GIS Map Component
// Visualizes kitchen dispatch hub, receiver shelters, distances, and algorithmic transit routes

import React from 'react';
import { Building2, MapPin, Navigation2, CheckCircle2, ShieldCheck, Thermometer } from 'lucide-react';
import { Receiver } from '../types.ts';

interface InteractiveMapProps {
  receivers: Receiver[];
  selectedReceiverId: string | null;
  onSelectReceiver: (id: string) => void;
  kitchenName?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  receivers,
  selectedReceiverId,
  onSelectReceiver,
  kitchenName = 'Campus Central Kitchen #04'
}) => {
  // SVG ViewBox coordinate mapping
  // Kitchen Center: (280, 180)
  const kitchenPos = { x: 280, y: 180 };

  // Scaled coordinates for the 3 Mumbai area receivers
  const receiverCoords: Record<string, { x: number; y: number }> = {
    'rec-asha-01': { x: 130, y: 140 }, // Mahim West (closer west)
    'rec-robin-02': { x: 160, y: 310 }, // Dadar South
    'rec-pratham-03': { x: 440, y: 220 } // Sion East
  };

  return (
    <div className="bg-[#141B2B] rounded-2xl overflow-hidden border border-gray-700 shadow-md relative">
      {/* Map Control Bar */}
      <div className="p-3 bg-[#0F172A] border-b border-gray-800 flex items-center justify-between text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-4 h-4 text-[#82F5C1]" />
          <span className="font-bold text-white">Algorithmic GIS Dispatch Matrix</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-mono">
            GPS: BKC Hub 19.0657°N, 72.8687°E
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">Click a node to inspect route</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[320px] bg-[#0B1120] flex items-center justify-center select-none overflow-hidden">
        <svg
          viewBox="0 0 560 380"
          className="w-full h-full"
          style={{ background: 'radial-gradient(circle at center, #131F37 0%, #0B1120 100%)' }}
        >
          {/* Background Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            </pattern>
            {/* Pulsing Gradient for active route */}
            <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#82F5C1" />
              <stop offset="100%" stopColor="#006C4A" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Range rings from Central Kitchen (5km, 10km) */}
          <circle cx={kitchenPos.x} cy={kitchenPos.y} r="100" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
          <circle cx={kitchenPos.x} cy={kitchenPos.y} r="180" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
          <text x={kitchenPos.x + 105} y={kitchenPos.y - 5} fill="#64748B" fontSize="9" fontFamily="monospace">3.5 km radius</text>
          <text x={kitchenPos.x + 185} y={kitchenPos.y - 5} fill="#64748B" fontSize="9" fontFamily="monospace">7.0 km radius</text>

          {/* Route Vectors from Kitchen to Receivers */}
          {receivers.map(rec => {
            const coords = receiverCoords[rec.id] || { x: 400, y: 100 };
            const isSelected = selectedReceiverId === rec.id;

            return (
              <g key={`route-${rec.id}`}>
                <line
                  x1={kitchenPos.x}
                  y1={kitchenPos.y}
                  x2={coords.x}
                  y2={coords.y}
                  stroke={isSelected ? 'url(#activeRouteGrad)' : '#334155'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeDasharray={isSelected ? '6,3' : 'none'}
                  className={isSelected ? 'animate-pulse' : ''}
                />
                {/* Distance tag on route midpoint */}
                <rect
                  x={(kitchenPos.x + coords.x) / 2 - 24}
                  y={(kitchenPos.y + coords.y) / 2 - 10}
                  width="48"
                  height="20"
                  rx="4"
                  fill={isSelected ? '#003527' : '#1E293B'}
                  stroke={isSelected ? '#82F5C1' : '#475569'}
                  strokeWidth="1"
                />
                <text
                  x={(kitchenPos.x + coords.x) / 2}
                  y={(kitchenPos.y + coords.y) / 2 + 4}
                  fill={isSelected ? '#82F5C1' : '#94A3B8'}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {rec.id === 'rec-asha-01' ? '2.4 km' : rec.id === 'rec-robin-02' ? '5.8 km' : '3.7 km'}
                </text>
              </g>
            );
          })}

          {/* Central Kitchen Origin Hub */}
          <g transform={`translate(${kitchenPos.x}, ${kitchenPos.y})`}>
            <circle r="22" fill="#006C4A" opacity="0.3" className="animate-ping" />
            <circle r="16" fill="#003527" stroke="#82F5C1" strokeWidth="2.5" />
            <circle r="5" fill="#82F5C1" />
            {/* Hub Label */}
            <rect x="-85" y="-36" width="170" height="20" rx="4" fill="#002114" stroke="#006C4A" strokeWidth="1" />
            <text x="0" y="-22" fill="#82F5C1" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              CENTRAL KITCHEN (HUB)
            </text>
          </g>

          {/* Receiver Destination Nodes */}
          {receivers.map(rec => {
            const coords = receiverCoords[rec.id] || { x: 400, y: 100 };
            const isSelected = selectedReceiverId === rec.id;

            return (
              <g
                key={rec.id}
                transform={`translate(${coords.x}, ${coords.y})`}
                onClick={() => onSelectReceiver(rec.id)}
                className="cursor-pointer group"
              >
                {isSelected && (
                  <circle r="24" fill="#82F5C1" opacity="0.25" className="animate-pulse" />
                )}
                <circle
                  r="14"
                  fill={isSelected ? '#006C4A' : '#1E293B'}
                  stroke={isSelected ? '#82F5C1' : '#64748B'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all group-hover:scale-110"
                />
                <circle r="4" fill={isSelected ? '#82F5C1' : '#94A3B8'} />

                {/* Receiver Name Tag */}
                <rect
                  x="-70"
                  y="18"
                  width="140"
                  height="22"
                  rx="4"
                  fill={isSelected ? '#00261C' : '#0F172A'}
                  stroke={isSelected ? '#82F5C1' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="33"
                  fill={isSelected ? '#82F5C1' : '#E2E8F0'}
                  fontSize="10"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {rec.name.split(' ')[0]} ({rec.type.split(' ')[0]})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Map Legend */}
        <div className="absolute bottom-2.5 left-3 bg-[#0F172A]/90 backdrop-blur-sm border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-3 text-[10px] text-gray-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#82F5C1] border border-black"></span>
            <span>Prep Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006C4A] border border-[#82F5C1]"></span>
            <span>Matched Recipient</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#475569]"></span>
            <span>Available Shelter</span>
          </div>
        </div>
      </div>
    </div>
  );
};
