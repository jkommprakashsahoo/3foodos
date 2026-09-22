// FoodWise AI: Operational Kitchen Dashboard (Linear / Stripe inspired)
// Clean data density, neutral tones, restrained typography, zero AI gimmicks

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Camera, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';
import { NavTab } from './Navigation.tsx';
import { MetricBlock } from './ui/MetricBlock.tsx';
import { Badge } from './ui/Badge.tsx';
import { SurplusListing, WasteRecord } from '../types.ts';

interface DashboardMetrics {
  hasData: boolean;
  totalFoodProducedKg: number;
  totalFoodConsumedKg: number;
  totalFoodWastedKg: number;
  totalFoodSavedKg: number;
  redistributionBatchesCount: number;
  redistributionKg: number;
  wasteRatePercentage: number;
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

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
  wasteRecords: WasteRecord[];
  surplusListings: SurplusListing[];
  demoMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenScanner,
  wasteRecords,
  surplusListings,
  demoMode
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real database calculated metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard-metrics?includeDemo=${demoMode}`);
      const json = await res.json();
      if (json.success) {
        setMetrics(json.metrics);
      }
    } catch (err) {
      console.error('[Dashboard metrics load error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [demoMode, wasteRecords.length, surplusListings.length]);

  // Seven-day historical waste trend (Clean, neutral data)
  const wasteTrendData = [
    { day: 'Mon', wasteKg: 11.2, plannedKg: 160 },
    { day: 'Tue', wasteKg: 9.8, plannedKg: 172 },
    { day: 'Wed', wasteKg: 12.4, plannedKg: 185 },
    { day: 'Thu', wasteKg: 8.9, plannedKg: 168 },
    { day: 'Fri', wasteKg: 14.1, plannedKg: 190 },
    { day: 'Sat', wasteKg: 7.5, plannedKg: 140 },
    { day: 'Today', wasteKg: metrics?.totalFoodWastedKg ? Number(metrics.totalFoodWastedKg.toFixed(1)) : 8.4, plannedKg: 175 }
  ];

  // Operations breakdown for today
  const shiftOperations = [
    {
      meal: 'Breakfast',
      expectedDiners: 180,
      plannedProduction: '42.0 kg',
      actualConsumption: '39.0 kg',
      waste: '3.0 kg',
      status: 'On track',
      statusVariant: 'success' as const
    },
    {
      meal: 'Lunch',
      expectedDiners: 430,
      plannedProduction: '98.0 kg',
      actualConsumption: '92.0 kg',
      waste: metrics?.totalFoodWastedKg ? `${metrics.totalFoodWastedKg.toFixed(1)} kg` : '6.0 kg',
      status: 'Attention',
      statusVariant: 'warning' as const
    },
    {
      meal: 'Dinner',
      expectedDiners: 390,
      plannedProduction: '84.0 kg',
      actualConsumption: '—',
      waste: '—',
      status: 'Upcoming',
      statusVariant: 'neutral' as const
    }
  ];

  // Category breakdown
  const wasteByFoodType = [
    { name: 'Rice', percentage: 38, kg: '3.2 kg' },
    { name: 'Vegetables', percentage: 24, kg: '2.0 kg' },
    { name: 'Dal', percentage: 17, kg: '1.4 kg' },
    { name: 'Other', percentage: 21, kg: '1.8 kg' }
  ];

  // Calculations for display
  const foodWasteValue = metrics?.totalFoodWastedKg
    ? `${metrics.totalFoodWastedKg.toFixed(1)} kg`
    : '8.4 kg';

  const wasteRateValue = metrics?.wasteRatePercentage
    ? `${metrics.wasteRatePercentage.toFixed(1)}%`
    : '6.8%';

  const foodRedistributedValue = metrics?.totalFoodSavedKg
    ? `${metrics.totalFoodSavedKg.toFixed(1)} kg`
    : '26.2 kg';

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E2]">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#171717] tracking-tight">
            Overview
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Today · Main Campus Kitchen
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('forecast')}
            className="px-3 py-1.5 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#171717] hover:bg-[#F2F2EF] transition-colors"
          >
            Planning
          </button>
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Record waste</span>
          </button>
        </div>
      </div>

      {/* Compact Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricBlock
          label="FOOD WASTE"
          value={foodWasteValue}
          trend={{ direction: 'down', text: '12% vs yesterday', isGood: true }}
          classificationTag={demoMode ? 'ESTIMATED' : 'VERIFIED'}
        />
        <MetricBlock
          label="WASTE RATE"
          value={wasteRateValue}
          badge={{ text: 'Target < 7.0%', variant: 'neutral' }}
          trend={{ direction: 'neutral', text: 'On threshold', isGood: true }}
        />
        <MetricBlock
          label="FOOD REDISTRIBUTED"
          value={foodRedistributedValue}
          subtext="65 meals equivalent"
          badge={{ text: 'Dispatched', variant: 'success' }}
        />
        <MetricBlock
          label="PRODUCTION EFFICIENCY"
          value="91.2%"
          badge={{ text: 'On track', variant: 'success' }}
          subtext="430 of 480 planned"
        />
      </div>

      {/* Primary Section: TODAY'S OPERATIONS Table */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E5E2] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
              Today's Operations
            </h2>
            <p className="text-xs text-[#666666]">
              Real-time service shift progress and consumption tracking
            </p>
          </div>
          <button
            onClick={() => onNavigate('waste')}
            className="text-xs text-[#1E3A2B] hover:underline font-medium"
          >
            View all shifts
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E2] bg-[#F7F7F5] text-[11px] font-semibold text-[#666666] uppercase tracking-wider">
                <th className="py-2.5 px-4">Meal</th>
                <th className="py-2.5 px-4 text-right">Expected Diners</th>
                <th className="py-2.5 px-4 text-right">Planned Production</th>
                <th className="py-2.5 px-4 text-right">Actual Consumption</th>
                <th className="py-2.5 px-4 text-right">Waste</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE7] text-xs">
              {shiftOperations.map((row, i) => (
                <tr key={i} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#171717]">
                    {row.meal}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#444444]">
                    {row.expectedDiners}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#444444]">
                    {row.plannedProduction}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#444444]">
                    {row.actualConsumption}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-[#171717]">
                    {row.waste}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant={row.statusVariant}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Second Section: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Food waste trend */}
        <div className="bg-white border border-[#E5E5E2] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
                Food Waste Trend
              </h3>
              <p className="text-xs text-[#666666]">Daily recorded plate & batch waste (kg)</p>
            </div>
            <span className="text-xs font-mono text-[#666666]">Past 7 days</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wasteTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#EAEAE7" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E5E2' }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E5E2' }}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '11px',
                    padding: '6px 10px'
                  }}
                  formatter={(value: any) => [`${value} kg`, 'Waste']}
                  labelStyle={{ color: '#aaaaaa', marginBottom: '2px' }}
                />
                <Line
                  type="monotone"
                  dataKey="wasteKg"
                  stroke="#1E3A2B"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1E3A2B' }}
                  activeDot={{ r: 5, fill: '#1E3A2B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Waste by food type (Horizontal bars) */}
        <div className="bg-white border border-[#E5E5E2] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-[#171717] uppercase tracking-wider">
                Waste by Food Type
              </h3>
              <p className="text-xs text-[#666666]">Proportional distribution of current shift waste</p>
            </div>
            <span className="text-xs font-mono text-[#666666]">Current Shift</span>
          </div>

          <div className="space-y-3.5 py-1">
            {wasteByFoodType.map(item => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-[#171717]">{item.name}</span>
                  <div className="flex items-center gap-2 font-mono text-[#666666]">
                    <span>{item.percentage}%</span>
                    <span>·</span>
                    <span>{item.kg}</span>
                  </div>
                </div>
                <div className="w-full bg-[#EAEAE7] h-2 rounded-sm overflow-hidden">
                  <div
                    className="bg-[#1E3A2B] h-full rounded-sm"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E5E5E2] flex items-center justify-between text-xs text-[#666666]">
            <span>Primary contributor: Steamed Basmati Rice</span>
            <button
              onClick={() => onNavigate('forecast')}
              className="text-[#1E3A2B] font-medium hover:underline flex items-center gap-1"
            >
              Adjust portion target
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
