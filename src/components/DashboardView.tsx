import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ArrowRight, Camera, RefreshCw } from 'lucide-react';
import { NavTab } from './Navigation.tsx';
import { MetricBlock } from './ui/MetricBlock.tsx';
import { Badge } from './ui/Badge.tsx';
import type { SurplusListing, WasteRecord } from '../types.ts';
import { getDashboardMetrics, listAttendance, listProduction } from '../services/dashboard.ts';
import type { AttendanceRecord, DashboardMetrics, ProductionRecord } from '../services/dashboard.ts';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenScanner: () => void;
  wasteRecords: WasteRecord[];
  surplusListings: SurplusListing[];
  demoMode: boolean;
}

type Period = 7 | 30 | 90;

const localDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftLabel = (shift: string) => shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase();

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenScanner,
  wasteRecords,
  surplusListings,
  demoMode
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(7);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      getDashboardMetrics(demoMode),
      listProduction(demoMode),
      listAttendance(demoMode)
    ]);
    const failures: string[] = [];
    if (results[0].status === 'fulfilled') setMetrics(results[0].value.metrics);
    else failures.push('summary metrics');
    if (results[1].status === 'fulfilled') setProduction(results[1].value.records);
    else failures.push('production records');
    if (results[2].status === 'fulfilled') setAttendance(results[2].value.records);
    else failures.push('attendance records');
    setError(failures.length ? `Unable to load ${failures.join(' and ')}.` : null);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, [demoMode, wasteRecords.length, surplusListings.length]);

  const today = localDate(new Date());
  const todayOperations = useMemo(() => {
    const shifts = new Set<string>();
    production.filter(record => record.date.slice(0, 10) === today).forEach(record => shifts.add(record.shift));
    attendance.filter(record => record.date.slice(0, 10) === today).forEach(record => shifts.add(record.shift));

    return [...shifts].map(shift => {
      const shiftProduction = production.filter(
        record => record.date.slice(0, 10) === today && record.shift.toLowerCase() === shift.toLowerCase()
      );
      const shiftAttendance = attendance.find(
        record => record.date.slice(0, 10) === today && record.shift.toLowerCase() === shift.toLowerCase()
      );
      const shiftWaste = wasteRecords.filter(record =>
        record.created_at.slice(0, 10) === today && record.service_shift.toLowerCase() === shift.toLowerCase()
      );
      const planned = shiftProduction.reduce((sum, record) => sum + Number(record.quantity_produced || 0), 0);
      const consumed = shiftProduction.reduce((sum, record) => sum + Number(record.consumed_kg || 0), 0);
      const waste = shiftWaste.reduce((sum, record) => sum + Number(record.user_confirmed_quantity || 0), 0);
      const status = shiftProduction.length ? 'Recorded' : shiftAttendance ? 'Planned' : 'No production data';
      return {
        shift,
        expectedDiners: shiftAttendance?.expected_people,
        planned,
        consumed,
        waste,
        status
      };
    }).sort((a, b) => {
      const order = ['breakfast', 'lunch', 'dinner'];
      return order.indexOf(a.shift.toLowerCase()) - order.indexOf(b.shift.toLowerCase());
    });
  }, [attendance, production, today, wasteRecords]);

  const chartData = useMemo(() => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period + 1);
    const daily = new Map<string, { date: string; production: number; consumption: number; waste: number }>();
    for (let day = new Date(fromDate); day <= new Date(); day.setDate(day.getDate() + 1)) {
      const key = localDate(day);
      daily.set(key, { date: key, production: 0, consumption: 0, waste: 0 });
    }
    production.forEach(record => {
      const row = daily.get(record.date.slice(0, 10));
      if (row) {
        row.production += Number(record.quantity_produced || 0);
        row.consumption += Number(record.consumed_kg || 0);
      }
    });
    wasteRecords.forEach(record => {
      const row = daily.get(record.created_at.slice(0, 10));
      if (row) row.waste += Number(record.user_confirmed_quantity || 0);
    });
    return [...daily.values()].map(row => ({
      ...row,
      day: new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [period, production, wasteRecords]);

  const wasteSources = useMemo(() => {
    const totals = new Map<string, number>();
    wasteRecords.forEach(record => {
      const name = record.food_name.toLowerCase();
      const category = name.includes('rice') || name.includes('grain') || name.includes('roti')
        ? 'Rice & grains'
        : name.includes('veg') || name.includes('subzi')
          ? 'Vegetables'
          : name.includes('dal') || name.includes('lentil')
            ? 'Dal & lentils'
            : 'Other';
      totals.set(category, (totals.get(category) || 0) + Number(record.user_confirmed_quantity || 0));
    });
    const sum = [...totals.values()].reduce((total, value) => total + value, 0);
    return [...totals.entries()]
      .map(([name, quantity]) => ({ name, quantity, percentage: sum > 0 ? quantity / sum * 100 : 0 }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [wasteRecords]);

  const totalWaste = metrics?.totalFoodWastedKg;
  const totalSaved = metrics?.totalFoodSavedKg;
  const totalRedistributed = metrics?.redistributionKg;
  const wasteRate = metrics?.wasteRatePercentage;
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-[1400px] space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-[#e2e6e1] pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-[#68736a]">Assigned kitchen · {dateLabel}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#202821]">Overview</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('forecast')} className="rounded-md border border-[#dfe4df] bg-white px-3 py-2 text-sm font-medium text-[#37433b] hover:bg-[#f3f5f2]">
            View forecast
          </button>
          <button onClick={onOpenScanner} className="inline-flex items-center gap-2 rounded-md bg-[#1f5c45] px-3 py-2 text-sm font-medium text-white hover:bg-[#194b39]">
            <Camera className="h-4 w-4" /> Record waste
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-[#e9c9a6] bg-[#fff8ee] px-3 py-2.5 text-sm text-[#765124]">
          <span>{error} Try again when the service is available.</span>
          <button onClick={() => void loadDashboard()} aria-label="Retry dashboard loading" className="rounded p-1 hover:bg-[#f7eddf]">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricBlock label="FOOD WASTE" value={isLoading ? '…' : totalWaste === undefined ? '—' : `${totalWaste.toFixed(1)} kg`} classificationTag={demoMode ? 'ESTIMATED' : 'VERIFIED'} />
        <MetricBlock label="FOOD SAVED" value={isLoading ? '…' : totalSaved === undefined ? '—' : `${totalSaved.toFixed(1)} kg`} subtext="Recorded from completed handovers" />
        <MetricBlock label="REDISTRIBUTED" value={isLoading ? '…' : totalRedistributed === undefined ? '—' : `${totalRedistributed.toFixed(1)} kg`} subtext="Active matched and dispatched lots" />
        <MetricBlock
          label="WASTE RATE"
          value={isLoading ? '…' : wasteRate == null ? '—' : `${wasteRate.toFixed(1)}%`}
          subtext={wasteRate == null ? 'Requires recorded production' : 'Calculated from recorded quantities'}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-[#e2e6e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8ebe7] px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-[#202821]">Today’s operations</h2>
            <p className="mt-0.5 text-xs text-[#68736a]">Service progress from logged attendance, production and scale records</p>
          </div>
          <button onClick={() => onNavigate('history')} className="text-xs font-medium text-[#1f5c45] hover:underline">Waste history</button>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-4" aria-label="Loading operations" role="status">
            <div className="h-8 animate-pulse rounded bg-[#f1f3f0]" />
            <div className="h-8 animate-pulse rounded bg-[#f1f3f0]" />
          </div>
        ) : todayOperations.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm font-medium text-[#313b33]">No operations recorded today</p>
            <p className="mt-1 text-xs text-[#68736a]">Record attendance and production to populate this table.</p>
            <button onClick={() => onNavigate('production')} className="mt-3 text-sm font-medium text-[#1f5c45] hover:underline">Open production plan</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[#f6f7f5] text-[11px] font-semibold uppercase tracking-wide text-[#68736a]">
                <tr>
                  <th className="px-4 py-2.5">Meal</th>
                  <th className="px-4 py-2.5 text-right">Expected diners</th>
                  <th className="px-4 py-2.5 text-right">Planned production</th>
                  <th className="px-4 py-2.5 text-right">Actual consumption</th>
                  <th className="px-4 py-2.5 text-right">Waste</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ec] text-sm">
                {todayOperations.map(row => (
                  <tr key={row.shift} className="hover:bg-[#fafbf9]">
                    <td className="px-4 py-3 font-medium">{shiftLabel(row.shift)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.expectedDiners ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.planned ? `${row.planned.toFixed(1)} kg` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.consumed ? `${row.consumed.toFixed(1)} kg` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.waste ? `${row.waste.toFixed(1)} kg` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={row.status === 'Recorded' ? 'success' : row.status === 'Planned' ? 'warning' : 'neutral'}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Waste vs production</h2>
              <p className="mt-0.5 text-xs text-[#68736a]">Daily quantities from recorded kitchen data</p>
            </div>
            <div className="flex gap-1 rounded-md border border-[#e2e6e1] p-0.5" aria-label="Chart date range">
              {([7, 30, 90] as const).map(days => (
                <button
                  key={days}
                  onClick={() => setPeriod(days)}
                  aria-pressed={period === days}
                  className={`rounded px-2 py-1 text-xs ${period === days ? 'bg-[#edf2ee] font-medium text-[#1f5c45]' : 'text-[#667168] hover:bg-[#f5f6f4]'}`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="h-[260px] animate-pulse rounded bg-[#f1f3f0]" role="status" aria-label="Loading chart" />
          ) : production.length === 0 && wasteRecords.length === 0 ? (
            <div className="grid h-[260px] place-items-center text-center">
              <div>
                <p className="text-sm font-medium">Not enough recorded data to chart</p>
                <p className="mt-1 text-xs text-[#68736a]">Production and verified waste entries will appear here.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid stroke="#edf0ec" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} unit=" kg" />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)} kg`]} />
                    <Line type="monotone" dataKey="production" name="Production" stroke="#76867a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="consumption" name="Consumption" stroke="#1f5c45" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="waste" name="Verified waste" stroke="#c58c42" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#68736a]">
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#76867a]" />Production</span>
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#1f5c45]" />Consumption</span>
                <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#c58c42]" />Verified waste</span>
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
          <div>
            <h2 className="text-base font-semibold">Top waste sources</h2>
            <p className="mt-0.5 text-xs text-[#68736a]">Grouped from recorded food names</p>
          </div>
          {isLoading ? (
            <div className="mt-5 space-y-4" role="status" aria-label="Loading waste sources">
              {[1, 2, 3].map(item => <div key={item} className="h-8 animate-pulse rounded bg-[#f1f3f0]" />)}
            </div>
          ) : wasteSources.length === 0 ? (
            <div className="grid min-h-[230px] place-items-center px-4 text-center">
              <p className="text-sm text-[#68736a]">No verified waste sources to summarize yet.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {wasteSources.map(source => (
                <div key={source.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{source.name}</span>
                    <span className="tabular-nums text-[#657168]">{source.quantity.toFixed(1)} kg · {source.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-[#edf0ec]" role="meter" aria-label={`${source.name} waste share`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(source.percentage)}>
                    <div className="h-full bg-[#587963]" style={{ width: `${source.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 border-t border-[#edf0ec] pt-3">
            <button onClick={() => onNavigate('history')} className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5c45] hover:underline">
              Review waste records <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-[#e2e6e1] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Tomorrow’s production recommendation</h2>
            <Badge variant="predicted">Predicted</Badge>
          </div>
          <p className="mt-1 text-sm text-[#68736a]">
            Recommendations appear when a forecast can be generated from the selected data mode and attendance inputs.
          </p>
        </div>
        <button onClick={() => onNavigate('forecast')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-[#dfe4df] px-3 py-2 text-sm font-medium hover:bg-[#f3f5f2]">
          Open forecast <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
};
