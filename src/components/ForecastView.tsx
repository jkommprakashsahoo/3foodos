import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Badge } from './ui/Badge.tsx';
import { getForecast, listFoodItems, type FoodItem } from '../services/forecast.ts';
import type { DemandForecastData } from '../types.ts';

interface ForecastViewProps {
  demoMode: boolean;
}

function tomorrowLocalDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ demoMode }) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [date, setDate] = useState(tomorrowLocalDate);
  const [shift, setShift] = useState('Lunch');
  const [diners, setDiners] = useState('');
  const [weather, setWeather] = useState('Normal');
  const [eventType, setEventType] = useState('Regular Service');
  const [foodItemId, setFoodItemId] = useState('');
  const [forecast, setForecast] = useState<DemandForecastData | null>(null);
  const [isLoadingFoods, setIsLoadingFoods] = useState(true);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodError, setFoodError] = useState<string | null>(null);

  const loadFoods = async () => {
    setIsLoadingFoods(true);
    setFoodError(null);
    try {
      const response = await listFoodItems();
      setFoods(response.foodItems);
      setFoodItemId(current => current || response.foodItems[0]?.id || '');
    } catch (loadError) {
      setFoodError(loadError instanceof Error ? loadError.message : 'Unable to load food items.');
    } finally {
      setIsLoadingFoods(false);
    }
  };

  useEffect(() => {
    void loadFoods();
  }, []);

  const runForecast = async () => {
    if (!foodItemId || !Number.isFinite(Number(diners)) || Number(diners) < 1) {
      setForecast(null);
      return;
    }
    setIsLoadingForecast(true);
    setError(null);
    try {
      const response = await getForecast({
        date,
        shift,
        diners: Number(diners),
        eventType,
        weather,
        foodItemId,
        includeDemo: demoMode
      });
      setForecast(response.data);
    } catch (requestError) {
      setForecast(null);
      setError(requestError instanceof Error ? requestError.message : 'Forecast is unavailable.');
    } finally {
      setIsLoadingForecast(false);
    }
  };

  useEffect(() => {
    if (foodItemId && diners) void runForecast();
  }, [date, shift, diners, weather, eventType, foodItemId, demoMode]);

  const isDemoForecast = forecast?.isDemo || forecast?.forecastType === 'DEMO FORECAST';

  return (
    <div className="max-w-[1400px] space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-[#e2e6e1] pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-[#68736a]">Production planning</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Demand forecast</h1>
          <p className="mt-1 text-sm text-[#68736a]">Recommendations are estimates derived from completed service records.</p>
        </div>
        <Badge variant={demoMode ? 'demo' : 'verified'}>{demoMode ? 'Demo data included' : 'Verified records only'}</Badge>
      </header>

      <section className="grid grid-cols-1 gap-3 rounded-lg border border-[#e2e6e1] bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-medium text-[#59645c]">
          Kitchen
          <div className="mt-1.5 flex h-10 items-center rounded-md border border-[#e0e5df] bg-[#f7f8f6] px-3 text-sm text-[#3f4941]">Main Campus Kitchen</div>
        </label>
        <label className="text-xs font-medium text-[#59645c]">
          Date
          <input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm text-[#202821]" />
        </label>
        <label className="text-xs font-medium text-[#59645c]">
          Meal
          <select value={shift} onChange={event => setShift(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm text-[#202821]">
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
          </select>
        </label>
        <label className="text-xs font-medium text-[#59645c]">
          Expected diners
          <input type="number" min={1} max={5000} inputMode="numeric" value={diners} onChange={event => setDiners(event.target.value)} placeholder="Enter attendance" className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm tabular-nums text-[#202821]" />
        </label>
        <label className="text-xs font-medium text-[#59645c]">
          Food item
          <select value={foodItemId} onChange={event => setFoodItemId(event.target.value)} disabled={isLoadingFoods || foods.length === 0} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm text-[#202821] disabled:bg-[#f3f4f2]">
            {foods.length === 0 && <option value="">{isLoadingFoods ? 'Loading…' : 'No food items available'}</option>}
            {foods.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-[#59645c]">
          Event schedule
          <select value={eventType} onChange={event => setEventType(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm text-[#202821]">
            <option>Regular Service</option><option>Exam Week</option><option>Banquet</option><option>Festival</option>
          </select>
        </label>
        <label className="text-xs font-medium text-[#59645c]">
          Weather input
          <select value={weather} onChange={event => setWeather(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm text-[#202821]">
            <option>Normal</option><option>Rain</option><option>Cold</option>
          </select>
        </label>
      </section>

      {foodError && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-3 text-sm text-[#87372b]">
          <span>{foodError}</span>
          <button onClick={() => void loadFoods()} className="inline-flex items-center gap-1 font-medium underline"><RefreshCw className="h-3.5 w-3.5" />Retry</button>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-3 text-sm text-[#87372b]">
          <span>{error} Check the date, attendance, and connection, then retry.</span>
          <button onClick={() => void runForecast()} className="inline-flex items-center gap-1 font-medium underline"><RefreshCw className="h-3.5 w-3.5" />Retry</button>
        </div>
      )}

      {!diners && !foodError && (
        <div className="rounded-lg border border-[#e2e6e1] bg-white px-5 py-10 text-center">
          <h2 className="text-base font-semibold">Enter expected attendance to generate a forecast</h2>
          <p className="mt-1 text-sm text-[#68736a]">FoodWise will use the selected meal’s historical service records.</p>
        </div>
      )}

      {isLoadingForecast && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(270px,0.8fr)]" role="status" aria-label="Generating forecast">
          <div className="h-56 animate-pulse rounded-lg border border-[#e2e6e1] bg-white" />
          <div className="h-56 animate-pulse rounded-lg border border-[#e2e6e1] bg-white" />
        </div>
      )}

      {!isLoadingForecast && forecast && (
        forecast.hasSufficientData ? (
          <>
            <section className="rounded-lg border border-[#e2e6e1] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ebe7] px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold">Recommended production</h2>
                  <p className="mt-0.5 text-sm text-[#68736a]">{forecast.foodName} · {shift} · {Number(diners).toLocaleString()} expected diners</p>
                </div>
                <Badge variant={isDemoForecast ? 'demo' : 'predicted'}>{isDemoForecast ? 'Demo forecast' : 'Predicted'}</Badge>
              </div>
              <div className="grid divide-y divide-[#edf0ec] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="p-4">
                  <p className="text-xs text-[#68736a]">Expected demand <span className="ml-1 font-medium text-[#315d41]">Estimated</span></p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{forecast.adjustedDemandKg.toFixed(1)} <span className="text-sm font-medium text-[#68736a]">kg</span></p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#68736a]">Recommended production <span className="ml-1 font-medium text-[#315d41]">Predicted</span></p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-[#1f5c45]">{forecast.recommendedProductionKg.toFixed(1)} <span className="text-sm font-medium text-[#68736a]">kg</span></p>
                  <p className="mt-1 text-xs text-[#68736a]">Includes {forecast.bufferMarginKg.toFixed(1)} kg planning buffer</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#68736a]">Expected waste range <span className="ml-1 font-medium text-[#8b682e]">Estimated</span></p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{forecast.expectedWasteRangeKg.min.toFixed(1)}–{forecast.expectedWasteRangeKg.max.toFixed(1)} <span className="text-sm font-medium text-[#68736a]">kg</span></p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(270px,0.8fr)]">
              <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
                <div className="flex items-center justify-between border-b border-[#edf0ec] pb-3">
                  <div>
                    <h2 className="text-base font-semibold">Why this recommendation</h2>
                    <p className="mt-0.5 text-xs text-[#68736a]">Factors returned by the forecasting engine</p>
                  </div>
                  <Badge variant="neutral">{forecast.confidenceScore}% confidence</Badge>
                </div>
                {forecast.factors.length ? (
                  <div className="divide-y divide-[#edf0ec]">
                    {forecast.factors.map(factor => (
                      <div key={factor.factor} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{factor.factor}</p>
                          <p className="mt-0.5 text-xs text-[#68736a]">{factor.description}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-medium tabular-nums ${factor.direction === 'increase' ? 'text-[#315d41]' : factor.direction === 'decrease' ? 'text-[#8b682e]' : 'text-[#68736a]'}`}>
                          {factor.impact_kg > 0 ? '+' : ''}{factor.impact_kg.toFixed(1)} kg
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-sm text-[#68736a]">No factor breakdown was returned for this forecast.</p>
                )}
              </section>

              <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
                <h2 className="text-base font-semibold">Prediction inputs</h2>
                <dl className="mt-3 divide-y divide-[#edf0ec] text-sm">
                  <div className="flex justify-between gap-3 py-2"><dt className="text-[#68736a]">Historical service records</dt><dd className="font-medium tabular-nums">{forecast.modelDetails.historicalRecordsUsed}</dd></div>
                  <div className="flex justify-between gap-3 py-2"><dt className="text-[#68736a]">Attendance entered</dt><dd className="font-medium tabular-nums">{forecast.expectedDiners.toLocaleString()}</dd></div>
                  <div className="flex justify-between gap-3 py-2"><dt className="text-[#68736a]">Meal</dt><dd className="font-medium">{forecast.shift}</dd></div>
                  <div className="flex justify-between gap-3 py-2"><dt className="text-[#68736a]">Training window</dt><dd className="font-medium tabular-nums">{forecast.modelDetails.trainingWindowDays} shifts</dd></div>
                  <div className="py-2"><dt className="text-[#68736a]">Model</dt><dd className="mt-1 font-medium">{forecast.modelDetails.algorithm}</dd></div>
                </dl>
                <p className="mt-3 border-t border-[#edf0ec] pt-3 text-xs leading-5 text-[#68736a]">
                  This is a model estimate, not a verified measurement. Review production quantities before use.
                </p>
              </section>
            </div>
          </>
        ) : (
          <section className="rounded-lg border border-[#e2e6e1] bg-white px-5 py-10 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-md bg-[#f7f3e9] text-[#84622d]"><AlertCircle className="h-5 w-5" /></div>
            <h2 className="mt-3 text-base font-semibold">Not enough verified history</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-[#68736a]">
              {forecast.message || 'FoodWise needs more completed service records before generating a reliable forecast.'}
            </p>
            <p className="mt-3 text-xs text-[#68736a]">
              Records available: <strong>{forecast.modelDetails.historicalRecordsUsed}</strong> · Minimum required by this model: <strong>3 completed shifts</strong>
            </p>
            <p className="mt-1 text-xs text-[#68736a]">No production recommendation has been generated.</p>
          </section>
        )
      )}

      <button onClick={() => void runForecast()} disabled={!diners || !foodItemId || isLoadingForecast} className="inline-flex items-center gap-2 rounded-md border border-[#dfe4df] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f3f5f2] disabled:cursor-not-allowed disabled:opacity-50">
        Refresh forecast <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};
