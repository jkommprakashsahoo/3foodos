import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, RefreshCw, Truck } from 'lucide-react';
import type { MatchRecommendation, Receiver, RedistributionAssignment, SurplusListing } from '../types.ts';
import { listSurplus } from '../services/surplus.ts';
import {
  assignSurplus,
  getSurplusMatches,
  listRedistribution,
  updateRedistributionStatus
} from '../services/redistribution.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import { Badge } from './ui/Badge.tsx';

interface RedistributionViewProps {
  selectedInitialId?: string | null;
  demoMode: boolean;
}

export const RedistributionView: React.FC<RedistributionViewProps> = ({
  selectedInitialId,
  demoMode
}) => {
  const [orders, setOrders] = useState<SurplusListing[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [assignments, setAssignments] = useState<RedistributionAssignment[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(selectedInitialId || null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [pickupTemperature, setPickupTemperature] = useState('');
  const [handoverTemperature, setHandoverTemperature] = useState('');
  const [handoverWeight, setHandoverWeight] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [surplus, redistribution] = await Promise.all([
        listSurplus(demoMode),
        listRedistribution(demoMode)
      ]);
      setOrders(surplus.surplus);
      setReceivers(redistribution.receivers);
      setAssignments(redistribution.matches);
      setSelectedOrderId(current => {
        const preferredId = selectedInitialId || current;
        return preferredId && surplus.surplus.some(item => item.id === preferredId)
          ? preferredId
          : surplus.surplus.find(item => item.status === 'available')?.id || surplus.surplus[0]?.id || null;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load redistribution data.');
    } finally {
      setIsLoading(false);
    }
  }, [demoMode, selectedInitialId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedOrder = orders.find(item => item.id === selectedOrderId);
  const activeAssignment = assignments.find(item => item.surplus_listing_id === selectedOrderId && item.status !== 'rejected');
  const assignedReceiver = receivers.find(receiver => receiver.id === activeAssignment?.receiver_id);
  const selectedRecommendation = recommendations.find(item => item.receiver.id === selectedReceiverId);
  const queue = useMemo(() => orders.filter(item => ['available', 'matched', 'dispatched'].includes(item.status)), [orders]);

  const findMatches = async () => {
    if (!selectedOrderId) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (latitude.trim() === '' || longitude.trim() === '' || !Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError('Enter valid kitchen latitude and longitude to calculate distance-based matches.');
      return;
    }
    setIsMatching(true);
    setError(null);
    setRecommendations([]);
    try {
      const response = await getSurplusMatches({
        surplusId: selectedOrderId,
        kitchenLat: lat,
        kitchenLng: lng,
        includeDemo: demoMode
      });
      setRecommendations(response.matches);
      setSelectedReceiverId(response.matches[0]?.receiver.id || null);
      if (!response.matches.length) setMessage('No eligible receivers were returned for this surplus item.');
      else setMessage(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Receiver matching is unavailable.');
    } finally {
      setIsMatching(false);
    }
  };

  const assignReceiver = async () => {
    if (!selectedOrderId || !selectedReceiverId) return;
    setIsSaving(true);
    setError(null);
    try {
      await assignSurplus({
        surplusId: selectedOrderId,
        receiverId: selectedReceiverId,
        kitchenLat: Number(latitude),
        kitchenLng: Number(longitude),
        includeDemo: demoMode
      });
      setMessage('Receiver assigned. Confirm pickup when the handover begins.');
      setRecommendations([]);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to assign this receiver.');
    } finally {
      setIsSaving(false);
    }
  };

  const progressAssignment = async (status: 'dispatched' | 'delivered') => {
    if (!activeAssignment) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateRedistributionStatus(
        activeAssignment.id,
        status,
        status === 'dispatched'
          ? { temperatureCelsius: Number(pickupTemperature) }
          : {
              temperatureCelsius: Number(handoverTemperature),
              handoverWeightKg: Number(handoverWeight),
              handoverNotes: handoverNotes.trim()
            }
      );
      setMessage(status === 'dispatched' ? 'Pickup confirmed.' : 'Transfer marked complete.');
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update transfer status.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] space-y-5">
      <header className="flex flex-col justify-between gap-3 border-b border-[#e2e6e1] pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium text-[#68736a]">Surplus logistics</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Redistribution</h1>
          <p className="mt-1 text-sm text-[#68736a]">Match eligible receivers, assign a handover and track pickup through completion.</p>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && <Badge variant="demo">Demo data included</Badge>}
          <button type="button" onClick={() => void loadData()} disabled={isLoading} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dfe4df] bg-white px-3 text-sm hover:bg-[#f3f5f2] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      {error && <div role="alert" className="flex items-center justify-between rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#87372b]"><span>{error}</span><button onClick={() => void loadData()} className="font-medium underline underline-offset-2">Retry</button></div>}
      {message && <div role="status" className="rounded-md border border-[#c9ddca] bg-[#f2f8f2] px-3 py-2.5 text-sm text-[#315a3a]">{message}</div>}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.6fr)]">
        <section className="overflow-hidden rounded-lg border border-[#e2e6e1] bg-white">
          <div className="flex items-center justify-between border-b border-[#e2e6e1] px-4 py-3">
            <h2 className="text-sm font-semibold">Available surplus</h2>
            <span className="text-xs text-[#68736a]">{queue.length} items</span>
          </div>
          {isLoading ? (
            <div role="status" className="space-y-2 p-4"><div className="h-14 animate-pulse rounded bg-[#f1f3f0]" /><div className="h-14 animate-pulse rounded bg-[#f1f3f0]" /></div>
          ) : queue.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[#68736a]">No available or active surplus listings.</p>
          ) : (
            <ul className="divide-y divide-[#edf0ec]">
              {queue.map(order => (
                <li key={order.id}>
                  <button type="button" onClick={() => { setSelectedOrderId(order.id); setRecommendations([]); setMessage(null); }} aria-pressed={selectedOrderId === order.id} className={`w-full p-4 text-left hover:bg-[#f7f8f6] ${selectedOrderId === order.id ? 'border-l-2 border-[#315a3a] bg-[#f3f7f3]' : ''}`}>
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{order.food_name}</span>
                      <Badge variant={order.status === 'available' ? 'success' : 'neutral'}>{order.status}</Badge>
                    </span>
                    <span className="mt-1 block text-xs text-[#68736a]">{order.quantity.toLocaleString()} {order.unit} · until {new Date(order.available_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="mt-1 block truncate text-xs text-[#68736a]">{order.pickup_location}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          {selectedOrder ? (
            <>
              <section className="rounded-lg border border-[#e2e6e1] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf0ec] pb-3">
                  <div>
                    <p className="text-xs text-[#68736a]">Selected surplus</p>
                    <h2 className="mt-1 text-lg font-semibold">{selectedOrder.food_name}</h2>
                    <p className="mt-1 text-sm text-[#68736a]">{selectedOrder.quantity.toLocaleString()} {selectedOrder.unit} · {selectedOrder.pickup_location}</p>
                  </div>
                  <Badge variant={selectedOrder.is_demo ? 'demo' : 'verified'}>{selectedOrder.is_demo ? 'Demo' : 'Verified'}</Badge>
                </div>

                {activeAssignment && assignedReceiver ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div><p className="text-xs text-[#68736a]">Assigned receiver</p><p className="mt-1 text-sm font-medium">{assignedReceiver.name}</p></div>
                      <div><p className="text-xs text-[#68736a]">Match score</p><p className="mt-1 text-sm font-medium">{activeAssignment.match_score.toFixed(0)} / 100</p></div>
                      <div><p className="text-xs text-[#68736a]">Distance</p><p className="mt-1 text-sm font-medium">{activeAssignment.distance_km.toFixed(1)} km</p></div>
                      <div><p className="text-xs text-[#68736a]">Estimated travel</p><p className="mt-1 text-sm font-medium">{activeAssignment.estimated_travel_time_mins} min</p></div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ec] pt-3">
                      <Badge variant="neutral">{activeAssignment.status}</Badge>
                      <div className="flex gap-2">
                        {activeAssignment.status === 'matched' && (
                          <div className="flex flex-wrap items-end gap-2">
                            <label className="text-xs font-medium text-[#59645c]">Measured pickup temperature (°C)<input type="number" min="-30" max="100" step="0.1" value={pickupTemperature} onChange={event => setPickupTemperature(event.target.value)} className="mt-1 h-9 w-44 rounded-md border border-[#dfe4df] px-2 text-sm" /></label>
                            <button type="button" disabled={isSaving || pickupTemperature === '' || !Number.isFinite(Number(pickupTemperature)) || Number(pickupTemperature) < -30 || Number(pickupTemperature) > 100} onClick={() => void progressAssignment('dispatched')} className="rounded-md bg-[#315a3a] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Confirm pickup</button>
                          </div>
                        )}
                        {activeAssignment.status === 'dispatched' && (
                          <div className="grid w-full gap-3 rounded-md border border-[#e2e6e1] bg-[#f7f8f6] p-3 sm:grid-cols-2">
                            <label className="text-xs font-medium text-[#59645c]">Received weight (kg)<input type="number" min="0.1" step="0.1" value={handoverWeight} onChange={event => setHandoverWeight(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#dfe4df] bg-white px-2 text-sm" /></label>
                            <label className="text-xs font-medium text-[#59645c]">Measured receiver temperature (°C)<input type="number" min="-30" max="100" step="0.1" value={handoverTemperature} onChange={event => setHandoverTemperature(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#dfe4df] bg-white px-2 text-sm" /></label>
                            <label className="text-xs font-medium text-[#59645c] sm:col-span-2">Handover notes (optional)<input value={handoverNotes} onChange={event => setHandoverNotes(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#dfe4df] bg-white px-2 text-sm" /></label>
                            <button type="button" disabled={isSaving || !Number.isFinite(Number(handoverWeight)) || Number(handoverWeight) <= 0 || !Number.isFinite(Number(handoverTemperature)) || Number(handoverTemperature) < -30 || Number(handoverTemperature) > 100} onClick={() => void progressAssignment('delivered')} className="rounded-md bg-[#315a3a] px-3 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">{isSaving ? 'Saving handover…' : 'Complete transfer'}</button>
                          </div>
                        )}
                        {activeAssignment.status === 'delivered' && <p className="text-sm font-medium text-[#315a3a]">Transfer completed</p>}
                      </div>
                    </div>
                  </div>
                ) : selectedOrder.status === 'matched' ? (
                  <p className="mt-4 rounded-md border border-[#ead9b4] bg-[#fffaf0] p-3 text-sm text-[#765124]">This item was reserved before receiver assignment tracking was available. Reopen it in surplus management to review its status.</p>
                ) : selectedOrder.status === 'available' ? (
                  <>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold">Receiver matching</h3>
                      <p className="mt-1 text-xs leading-5 text-[#68736a]">Enter the kitchen's configured coordinates. Distance and match score are calculated from the kitchen and receiver records; coordinates are not inferred from GPS.</p>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <label className="text-xs font-medium text-[#59645c]">Kitchen latitude<input inputMode="decimal" value={latitude} onChange={event => setLatitude(event.target.value)} placeholder="Required" className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] px-3 text-sm" /></label>
                      <label className="text-xs font-medium text-[#59645c]">Kitchen longitude<input inputMode="decimal" value={longitude} onChange={event => setLongitude(event.target.value)} placeholder="Required" className="mt-1.5 h-10 w-full rounded-md border border-[#e0e5df] px-3 text-sm" /></label>
                      <button type="button" disabled={isMatching} onClick={() => void findMatches()} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe4df] px-3 text-sm font-medium hover:bg-[#f3f5f2] disabled:opacity-50">
                        <Truck className="h-4 w-4" /> {isMatching ? 'Matching…' : 'Find receivers'}
                      </button>
                    </div>
                    {recommendations.length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-[#edf0ec] pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div><h3 className="text-sm font-semibold">Eligible receivers</h3><p className="mt-0.5 text-xs text-[#68736a]">Scores are returned by the matching engine.</p></div>
                          <button type="button" disabled={!selectedRecommendation || isSaving} onClick={() => void assignReceiver()} className="inline-flex items-center gap-2 rounded-md bg-[#315a3a] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{isSaving ? 'Assigning…' : 'Assign receiver'} <ArrowRight className="h-4 w-4" /></button>
                        </div>
                        <div className="divide-y divide-[#edf0ec] rounded-md border border-[#e2e6e1]">
                          {recommendations.map(match => (
                            <label key={match.receiver.id} className={`flex cursor-pointer flex-wrap items-center justify-between gap-3 p-3 ${selectedReceiverId === match.receiver.id ? 'bg-[#f3f7f3]' : 'bg-white'}`}>
                              <span className="flex min-w-0 items-center gap-3">
                                <input type="radio" name="receiver" value={match.receiver.id} checked={selectedReceiverId === match.receiver.id} onChange={() => setSelectedReceiverId(match.receiver.id)} aria-label={`Select ${match.receiver.name}`} />
                                <span className="min-w-0"><span className="block truncate text-sm font-medium">{match.receiver.name}</span><span className="mt-0.5 block text-xs text-[#68736a]">{match.remainingCapacityKg.toFixed(1)} kg remaining capacity · availability not supplied</span></span>
                              </span>
                              <span className="text-right text-xs text-[#59645c]">{match.distanceKm.toFixed(1)} km · {match.estimatedTransitTimeMins} min<br /><span className="font-medium">Match {match.matchScore.toFixed(0)} / 100</span></span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-[#68736a]">No receiver assignment is available for this transfer status.</p>
                )}
              </section>
              <InteractiveMap receivers={receivers} selectedReceiverId={activeAssignment?.receiver_id || selectedReceiverId} onSelectReceiver={setSelectedReceiverId} kitchenName={selectedOrder.pickup_location} />
            </>
          ) : !isLoading ? (
            <div className="rounded-lg border border-[#e2e6e1] bg-white px-5 py-12 text-center">
              <h2 className="text-base font-semibold">Select surplus to begin</h2>
              <p className="mt-1 text-sm text-[#68736a]">Available items will show receiver options and transfer status here.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
