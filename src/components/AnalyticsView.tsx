import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Info, RefreshCw } from 'lucide-react';
import { getAnalytics } from '../services/analytics.ts';
import type { SustainabilityMetrics } from '../types.ts';
import { MetricBlock } from './ui/MetricBlock.tsx';
import { Badge } from './ui/Badge.tsx';

interface AnalyticsViewProps {
  demoMode: boolean;
}

type Timeframe = 'today' | 'this_week' | 'this_month' | 'all_time';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ demoMode }) => {
  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('all_time');
  const [showMethodology, setShowMethodology] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAnalytics({ timeframe, verifiedOnly: !demoMode });
      setMetrics(response.metrics);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Analytics could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [timeframe, demoMode]);

  const hasData = Boolean(metrics && metrics.totalLogsCount > 0);
  const value = (number?: number, unit = '') =>
    isLoading ? '…' : number === undefined ? '—' : `${number.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`;

  return (
    <div className="max-w-[1400px] space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-[#e2e6e1] pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-[#68736a]">Operational reporting</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analytics & impact</h1>
          <p className="mt-1 text-sm text-[#68736a]">Metrics are calculated from the selected waste and redistribution records.</p>
        </div>
        <Badge variant={demoMode ? 'demo' : 'verified'}>{demoMode ? 'Demo data included' : 'Verified records only'}</Badge>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-[#e2e6e1] bg-white p-3">
        <label className="min-w-44 text-xs font-medium text-[#59645c]">
          Reporting period
          <select value={timeframe} onChange={event => setTimeframe(event.target.value as Timeframe)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm">
            <option value="today">Today</option><option value="this_week">Last 7 days</option><option value="this_month">This month</option><option value="all_time">All time</option>
          </select>
        </label>
        <button onClick={() => void loadAnalytics()} disabled={isLoading} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#dfe4df] px-3 text-sm font-medium hover:bg-[#f3f5f2] disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#87372b]">
          <span>{error}</span>
          <button onClick={() => void loadAnalytics()} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricBlock label="FOOD SAVED" value={value(metrics?.foodSavedKg, ' kg')} classificationTag="ESTIMATED" subtext="Derived from logged surplus and handovers" />
        <MetricBlock label="WASTE REDUCED" value={value(metrics?.wasteReducedKg, ' kg')} classificationTag="ESTIMATED" subtext="Calculated by the impact methodology" />
        <MetricBlock label="MEALS EQUIVALENT" value={value(metrics?.mealsEquivalent)} classificationTag="ESTIMATED" subtext="Conversion is methodology-dependent" />
        <MetricBlock label="COST SAVINGS" value={metrics ? `₹${metrics.financialSavingsInr.toLocaleString()}` : isLoading ? '…' : '—'} classificationTag="ESTIMATED" subtext="Derived estimate, not ledger value" />
      </section>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" role="status" aria-label="Loading analytics">
          <div className="h-72 animate-pulse rounded-lg border border-[#e2e6e1] bg-white" />
          <div className="h-72 animate-pulse rounded-lg border border-[#e2e6e1] bg-white" />
        </div>
      )}

      {!isLoading && !error && !hasData && (
        <div className="rounded-lg border border-[#e2e6e1] bg-white px-5 py-7 text-center">
          <h2 className="text-base font-semibold">No impact records for this period</h2>
          <p className="mt-1 text-sm text-[#68736a]">Verified scale records and completed redistribution handovers will populate these reports.</p>
        </div>
      )}

      {!isLoading && metrics && hasData && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.8fr)]">
            <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
              <div>
                <h2 className="text-base font-semibold">Waste trend & food diverted</h2>
                <p className="mt-0.5 text-xs text-[#68736a]">Daily totals returned by the analytics service</p>
              </div>
              {metrics.weeklyTrend.length ? (
                <>
                  <div className="mt-3 h-[270px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.weeklyTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#edf0ec" vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis tickLine={false} axisLine={false} fontSize={11} unit=" kg" />
                        <Tooltip formatter={(entry: number) => [`${entry.toFixed(1)} kg`]} />
                        <Legend />
                        <Bar dataKey="wasteKg" name="Recorded waste" fill="#c58c42" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="divertedKg" name="Food diverted" fill="#4e765a" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="grid h-64 place-items-center text-center text-sm text-[#68736a]">No daily trend series was returned for this period.</div>
              )}
            </section>

            <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
              <h2 className="text-base font-semibold">Operations by meal</h2>
              <p className="mt-0.5 text-xs text-[#68736a]">Waste and diverted quantities from available records</p>
              {metrics.shiftBreakdown.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[11px] font-semibold uppercase tracking-wide text-[#68736a]">
                      <tr><th className="py-2">Meal</th><th className="py-2 text-right">Waste</th><th className="py-2 text-right">Diverted</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0ec]">
                      {metrics.shiftBreakdown.map(item => (
                        <tr key={item.shift}>
                          <td className="py-2.5 font-medium">{item.shift}</td>
                          <td className="py-2.5 text-right tabular-nums">{item.wasteKg.toFixed(1)} kg</td>
                          <td className="py-2.5 text-right tabular-nums">{item.divertedKg.toFixed(1)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid h-52 place-items-center text-center text-sm text-[#68736a]">No meal breakdown was returned.</div>
              )}
              <div className="mt-4 border-t border-[#edf0ec] pt-3 text-xs text-[#68736a]">
                {metrics.totalLogsCount.toLocaleString()} source records · {metrics.dataClassification === 'VERIFIED_ONLY' ? 'verified only' : 'demo and verified data'}
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Environmental impact</h2>
                <p className="mt-0.5 text-xs text-[#68736a]">Derived indicators are estimates, not direct measurements.</p>
              </div>
              <button onClick={() => setShowMethodology(show => !show)} className="inline-flex items-center gap-2 rounded-md border border-[#dfe4df] px-3 py-2 text-sm font-medium hover:bg-[#f3f5f2]">
                <Info className="h-4 w-4" /> Methodology
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetricBlock label="AVOIDED EMISSIONS" value={`${metrics.avoidedCo2eKg.toFixed(1)} kg CO₂e`} classificationTag="ESTIMATED" />
              <MetricBlock label="WATER FOOTPRINT SAVED" value={`${metrics.waterSavedLiters.toLocaleString()} L`} classificationTag="ESTIMATED" />
            </div>
            {showMethodology && (
              <dl className="mt-4 grid gap-3 border-t border-[#edf0ec] pt-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-[#68736a]">Meal equivalence</dt><dd className="mt-1">{metrics.methodology.mealConversionFormula}</dd></div>
                <div><dt className="text-xs text-[#68736a]">Emissions factor</dt><dd className="mt-1">{metrics.methodology.co2eEmissionFactor}</dd></div>
                <div><dt className="text-xs text-[#68736a]">Water factor</dt><dd className="mt-1">{metrics.methodology.waterFootprintFactor}</dd></div>
                <div><dt className="text-xs text-[#68736a]">Cost factor</dt><dd className="mt-1">{metrics.methodology.financialCostFactor}</dd></div>
                {!!metrics.methodology.sourceReferences.length && (
                  <div className="sm:col-span-2"><dt className="text-xs text-[#68736a]">References</dt><dd className="mt-1">{metrics.methodology.sourceReferences.join(' · ')}</dd></div>
                )}
              </dl>
            )}
          </section>
        </>
      )}
    </div>
  );
};
