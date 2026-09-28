import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Badge } from './ui/Badge.tsx';
import { createProductionRecord, getForecast, listFoodItems, type FoodItem } from '../services/forecast.ts';
import type { DemandForecastData } from '../types.ts';

interface ProductionViewProps {
  demoMode: boolean;
}

interface PlanRow {
  item: FoodItem;
  forecast: DemandForecastData;
}

function todayLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const ProductionView: React.FC<ProductionViewProps> = ({ demoMode }) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [date, setDate] = useState(todayLocalDate);
  const [shift, setShift] = useState('Lunch');
  const [diners, setDiners] = useState('');
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [quantityOverrides, setQuantityOverrides] = useState<Record<string, string>>({});
  const [actualQuantities, setActualQuantities] = useState<Record<string, string>>({});
  const [recordedIds, setRecordedIds] = useState<string[]>([]);
  const [isLoadingFoods, setIsLoadingFoods] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadFoods = async () => {
    setIsLoadingFoods(true);
    setError(null);
    try {
      const response = await listFoodItems();
      setFoods(response.foodItems);
      setSelectedItems(current => current.length ? current : response.foodItems.slice(0, 4).map(item => item.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the food catalogue.');
    } finally {
      setIsLoadingFoods(false);
    }
  };

  useEffect(() => {
    void loadFoods();
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItems(current => current.includes(id) ? current.filter(itemId => itemId !== id) : [...current, id]);
  };

  const generatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!Number.isFinite(Number(diners)) || Number(diners) < 1) {
      setError('Enter expected attendance as a positive whole number.');
      return;
    }
    if (!selectedItems.length) {
      setError('Select at least one food item to plan.');
      return;
    }

    setIsGenerating(true);
    try {
      const forecasts = await Promise.all(
        selectedItems.map(async itemId => {
          const item = foods.find(food => food.id === itemId);
          if (!item) return null;
          const response = await getForecast({
            date,
            shift,
            diners: Number(diners),
            eventType: 'Regular Service',
            weather: 'Normal',
            foodItemId: itemId,
            includeDemo: demoMode
          });
          return { item, forecast: response.data };
        })
      );
      const nextRows = forecasts.filter((value): value is PlanRow => value !== null);
      setRows(nextRows);
      setQuantityOverrides(Object.fromEntries(nextRows.map(row => [
        row.item.id,
        row.forecast.hasSufficientData ? String(row.forecast.recommendedProductionKg) : ''
      ])));
      setActualQuantities({});
      setRecordedIds([]);
    } catch (requestError) {
      setRows([]);
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate the production plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const recordActualProduction = async (row: PlanRow) => {
    const quantity = Number(actualQuantities[row.item.id]);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError(`Enter the actual produced quantity for ${row.item.name}.`);
      return;
    }
    setSavingItemId(row.item.id);
    setError(null);
    setSuccess(null);
    try {
      await createProductionRecord({
        food_item_id: row.item.id,
        quantity_produced: quantity,
        unit: row.item.default_unit || 'kg',
        date,
        shift,
        is_demo: false
      });
      setRecordedIds(ids => [...ids, row.item.id]);
      setSuccess(`Actual production for ${row.item.name} was recorded.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to record actual production.');
    } finally {
      setSavingItemId(null);
    }
  };

  return (
    <div className="max-w-[1400px] space-y-5">
      <header className="border-b border-[#e2e6e1] pb-4">
        <p className="text-xs font-medium text-[#68736a]">Kitchen execution</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Production plan</h1>
        <p className="mt-1 text-sm text-[#68736a]">Generate item-level recommendations, adjust the working quantities, and record actual production when service begins.</p>
      </header>

      <form onSubmit={generatePlan} className="rounded-lg border border-[#e2e6e1] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-medium text-[#59645c]">
            Service date
            <input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm" />
          </label>
          <label className="text-xs font-medium text-[#59645c]">
            Meal
            <select value={shift} onChange={event => setShift(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm">
              <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
            </select>
          </label>
          <label className="text-xs font-medium text-[#59645c]">
            Expected diners
            <input type="number" min={1} max={5000} inputMode="numeric" required value={diners} onChange={event => setDiners(event.target.value)} placeholder="Enter attendance" className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] bg-white px-3 text-sm tabular-nums" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={isGenerating || isLoadingFoods || !foods.length} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1f5c45] px-3 text-sm font-medium text-white hover:bg-[#194b39] disabled:cursor-not-allowed disabled:opacity-50">
              {isGenerating ? 'Generating…' : 'Generate plan'}
            </button>
          </div>
        </div>

        <fieldset className="mt-4 border-t border-[#edf0ec] pt-3">
          <legend className="px-1 text-xs font-medium text-[#59645c]">Food items</legend>
          {isLoadingFoods ? (
            <p className="py-2 text-sm text-[#68736a]" role="status">Loading food catalogue…</p>
          ) : foods.length === 0 ? (
            <div className="flex items-center justify-between py-2 text-sm text-[#68736a]">
              <span>No food items are available in the catalogue.</span>
              <button type="button" onClick={() => void loadFoods()} className="inline-flex items-center gap-1 text-[#1f5c45]"><RefreshCw className="h-4 w-4" />Retry</button>
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
              {foods.map(food => (
                <label key={food.id} className="flex min-h-9 items-center gap-2 text-sm text-[#39443c]">
                  <input type="checkbox" checked={selectedItems.includes(food.id)} onChange={() => toggleItem(food.id)} />
                  {food.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </form>

      {error && <div role="alert" className="rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#87372b]">{error}</div>}
      {success && <div role="status" className="flex items-center gap-2 rounded-md border border-[#cfe0d4] bg-[#f1f7f2] px-3 py-2.5 text-sm text-[#285c3e]"><CheckCircle2 className="h-4 w-4" />{success}</div>}

      {isGenerating && (
        <div role="status" aria-label="Generating production recommendations" className="space-y-2 rounded-lg border border-[#e2e6e1] bg-white p-4">
          {[1, 2, 3].map(item => <div key={item} className="h-10 animate-pulse rounded bg-[#f1f3f0]" />)}
        </div>
      )}

      {!isGenerating && rows.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-[#e2e6e1] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8ebe7] px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">Production recommendations</h2>
              <p className="mt-0.5 text-xs text-[#68736a]">Adjust the working target. Only “Record actual” writes production history.</p>
            </div>
            <Badge variant={demoMode ? 'demo' : 'verified'}>{demoMode ? 'Demo data included' : 'Verified records only'}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f6f7f5] text-[11px] font-semibold uppercase tracking-wide text-[#68736a]">
                <tr>
                  <th className="px-4 py-2.5">Food</th>
                  <th className="px-4 py-2.5 text-right">Expected demand</th>
                  <th className="px-4 py-2.5 text-right">Recommended production</th>
                  <th className="px-4 py-2.5 text-right">Working quantity</th>
                  <th className="px-4 py-2.5 text-right">Expected waste range</th>
                  <th className="px-4 py-2.5 text-right">Actual production</th>
                  <th className="px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ec] text-sm">
                {rows.map(row => (
                  <tr key={row.item.id} className="align-middle">
                    <td className="px-4 py-3 font-medium">{row.item.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.forecast.hasSufficientData ? `${row.forecast.adjustedDemandKg.toFixed(1)} kg` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.forecast.hasSufficientData ? `${row.forecast.recommendedProductionKg.toFixed(1)} kg` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {row.forecast.hasSufficientData ? (
                        <label className="sr-only" htmlFor={`plan-${row.item.id}`}>Working production quantity for {row.item.name}</label>
                      ) : null}
                      {row.forecast.hasSufficientData ? (
                        <input id={`plan-${row.item.id}`} type="number" min="0.1" step="0.1" value={quantityOverrides[row.item.id] || ''} onChange={event => setQuantityOverrides(values => ({ ...values, [row.item.id]: event.target.value }))} className="w-28 rounded-md border border-[#dfe4df] px-2 py-1.5 text-right tabular-nums" />
                      ) : <span className="text-xs text-[#68736a]">Insufficient history</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.forecast.hasSufficientData ? `${row.forecast.expectedWasteRangeKg.min.toFixed(1)}–${row.forecast.expectedWasteRangeKg.max.toFixed(1)} kg` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <label className="sr-only" htmlFor={`actual-${row.item.id}`}>Actual produced quantity for {row.item.name}</label>
                      <input id={`actual-${row.item.id}`} type="number" min="0.1" step="0.1" value={actualQuantities[row.item.id] || ''} onChange={event => setActualQuantities(values => ({ ...values, [row.item.id]: event.target.value }))} className="w-28 rounded-md border border-[#dfe4df] px-2 py-1.5 text-right tabular-nums" placeholder={row.item.default_unit || 'kg'} />
                    </td>
                    <td className="px-4 py-3">
                      {recordedIds.includes(row.item.id) ? (
                        <Badge variant="success">Recorded</Badge>
                      ) : (
                        <button type="button" onClick={() => void recordActualProduction(row)} disabled={!row.forecast.hasSufficientData || savingItemId === row.item.id} className="rounded-md border border-[#dfe4df] px-2.5 py-1.5 text-xs font-medium hover:bg-[#f3f5f2] disabled:cursor-not-allowed disabled:opacity-50">
                          {savingItemId === row.item.id ? 'Saving…' : 'Record actual'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!isGenerating && !rows.length && (
        <div className="rounded-lg border border-[#e2e6e1] bg-white px-5 py-7 text-center">
          <h2 className="text-base font-semibold">Build a service production plan</h2>
          <p className="mt-1 text-sm text-[#68736a]">Choose the meal, expected attendance, and food items to request model recommendations.</p>
        </div>
      )}
    </div>
  );
};
