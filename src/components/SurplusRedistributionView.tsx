// FoodWise AI Surplus Inventory & Algorithmic Redistribution View

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Thermometer,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { MatchRecommendation, Receiver, SurplusListing } from '../types.ts';
import { InteractiveMap } from './InteractiveMap.tsx';

interface SurplusRedistributionViewProps {
  initialPreloadItem?: { name: string; quantity: number; unit: string } | null;
  onClearPreloadItem?: () => void;
}

export const SurplusRedistributionView: React.FC<SurplusRedistributionViewProps> = ({
  initialPreloadItem,
  onClearPreloadItem
}) => {
  const [surplusListings, setSurplusListings] = useState<SurplusListing[]>([]);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [selectedSurplusId, setSelectedSurplusId] = useState<string | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [matchRecommendations, setMatchRecommendations] = useState<MatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Surplus Form State
  const [newFoodName, setNewFoodName] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('8.0');
  const [newDietaryType, setNewDietaryType] = useState<string>('Vegetarian');
  const [newPackaging, setNewPackaging] = useState<string>('Hygienic Steel Sealed (GN 1/1)');
  const [newTempCelsius, setNewTempCelsius] = useState<string>('65.0');
  const [newHoursAvailable, setNewHoursAvailable] = useState<string>('3.5');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If a preloaded item was passed from waste confirmation
  useEffect(() => {
    if (initialPreloadItem) {
      setNewFoodName(initialPreloadItem.name);
      setNewQuantity(initialPreloadItem.quantity.toString());
      setShowCreateModal(true);
      onClearPreloadItem?.();
    }
  }, [initialPreloadItem]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [surplusRes, receiversRes] = await Promise.all([
        fetch('/api/surplus'),
        fetch('/api/receivers')
      ]);

      const surplusJson = await surplusRes.json();
      const receiversJson = await receiversRes.json();

      if (surplusJson.success) {
        setSurplusListings(surplusJson.surplus);
        if (surplusJson.surplus.length > 0 && !selectedSurplusId) {
          setSelectedSurplusId(surplusJson.surplus[0].id);
        }
      }

      if (receiversJson.success) {
        setReceivers(receiversJson.receivers);
      }
    } catch (err) {
      console.error('[Surplus View Load Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected surplus changes, run algorithmic match
  useEffect(() => {
    if (!selectedSurplusId) return;

    const runMatch = async () => {
      setIsMatching(true);
      try {
        const res = await fetch('/api/match-surplus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surplusId: selectedSurplusId,
            kitchenLat: 19.0657,
            kitchenLng: 72.8687
          })
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.matches)) {
          setMatchRecommendations(json.matches);
          if (json.matches.length > 0) {
            setSelectedReceiverId(json.matches[0].receiver.id);
          }
        }
      } catch (err) {
        console.error('[Surplus Match Error]', err);
      } finally {
        setIsMatching(false);
      }
    };

    runMatch();
  }, [selectedSurplusId]);

  const handleCreateSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newQuantity);
    if (!newFoodName || isNaN(qty) || qty <= 0) return;

    setIsSubmitting(true);
    try {
      const availableUntil = new Date(Date.now() + parseFloat(newHoursAvailable) * 3600 * 1000).toISOString();
      const res = await fetch('/api/surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: newFoodName,
          quantity: qty,
          unit: 'kg',
          available_until: availableUntil,
          pickup_location: 'Central Kitchen Dispatch Dock #2',
          temperature_celsius: parseFloat(newTempCelsius) || 65.0,
          packaging_type: newPackaging,
          dietary_type: newDietaryType,
          notes: newNotes,
          is_demo: false
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setNewFoodName('');
        await loadData();
        setSelectedSurplusId(json.listing.id);
      }
    } catch (err) {
      console.error('[Create surplus error]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/surplus/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setSurplusListings(prev =>
          prev.map(item => (item.id === id ? { ...item, status: newStatus as any } : item))
        );
      }
    } catch (err) {
      console.error('[Update status error]', err);
    }
  };

  const selectedSurplusItem = surplusListings.find(s => s.id === selectedSurplusId);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-6 h-6 text-[#006C4A]" />
            <h1 className="text-xl font-bold text-[#003527]">Surplus Inventory & Algorithmic Redistribution</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#82F5C1]/50 text-[#002114]">
              Safe Transit Routing
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
            Surplus meals are algorithmically matched to verified shelters based on travel distance, recipient capacity, dietary compatibility, and remaining thermal shelf-life.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006C4A] hover:bg-[#005238] text-white text-xs font-bold shadow-md transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Fresh Surplus Batch</span>
        </button>
      </div>

      {/* Main Grid: Surplus Batches List & Algorithmic Matching Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Active Surplus Batches */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#141B2B] flex items-center gap-2">
              <span>Active Surplus Batches</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-[#006C4A]">
                {surplusListings.length}
              </span>
            </h2>
            <span className="text-[11px] text-gray-500 font-medium">Select batch to match</span>
          </div>

          <div className="flex flex-col gap-3">
            {surplusListings.map(item => {
              const isSelected = selectedSurplusId === item.id;
              const hoursLeft = Math.max(
                Math.round(((new Date(item.available_until).getTime() - Date.now()) / (3600 * 1000)) * 10) / 10,
                0
              );

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSurplusId(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#006C4A] shadow-md ring-2 ring-[#82F5C1]/50'
                      : 'bg-white border-[#E2E8F0] hover:border-gray-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#141B2B]">{item.food_name}</span>
                        {item.is_demo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            DEMO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.packaging_type}</p>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'dispatched' ? 'bg-amber-100 text-amber-700' :
                      item.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-emerald-50 text-[#006C4A] border border-emerald-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 my-2 border-y border-gray-100 text-center">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Quantity</span>
                      <span className="text-sm font-bold text-[#003527]">{item.quantity} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Holding Temp</span>
                      <span className="text-xs font-semibold text-gray-800">{item.temperature_celsius || 65}°C</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Time Left</span>
                      <span className="text-xs font-bold text-amber-700">{hoursLeft} hrs</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                    <span className="truncate max-w-[200px]">{item.pickup_location}</span>
                    <span className="text-[#006C4A] font-semibold flex items-center gap-1">
                      <span>View Route</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): Interactive GIS Route Map & Match Recommendations */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Interactive Route Vector Map */}
          <InteractiveMap
            receivers={receivers}
            selectedReceiverId={selectedReceiverId}
            onSelectReceiver={(id) => setSelectedReceiverId(id)}
          />

          {/* Algorithmic Match Explanations */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#006C4A]" />
                <h3 className="text-sm font-bold text-[#003527]">
                  Algorithmic Receiver Recommendations for {selectedSurplusItem?.food_name || 'Selected Batch'}
                </h3>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">Ranked by Haversine & Capacity</span>
            </div>

            {isMatching ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Evaluating GPS transit times and recipient capacity...
              </div>
            ) : matchRecommendations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No verified receivers available within the safe thermal radius.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {matchRecommendations.map((match, idx) => {
                  const isTopMatch = idx === 0;
                  const isSelected = selectedReceiverId === match.receiver.id;

                  return (
                    <div
                      key={match.receiver.id}
                      onClick={() => setSelectedReceiverId(match.receiver.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F9F9FF] border-[#006C4A] shadow-xs ring-1 ring-[#006C4A]'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#141B2B]">{match.receiver.name}</span>
                            {isTopMatch && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#82F5C1] text-[#002114]">
                                TOP RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{match.receiver.address}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-lg font-extrabold text-[#006C4A]">{match.matchScore}%</span>
                          <span className="text-[10px] text-gray-500 block">Match Score</span>
                        </div>
                      </div>

                      {/* Route Metrics Pill Row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 my-2.5 py-2 px-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#006C4A]" />
                          <span><strong>{match.distanceKm} km</strong> distance</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span><strong>{match.estimatedTransitTimeMins} mins</strong> travel ETA</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{match.remainingCapacityKg} kg absorption cap</span>
                        </div>
                      </div>

                      {/* Explicit Transparent Reasons */}
                      <div className="space-y-1 mb-3">
                        {match.recommendationReasons.map((reason, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-1.5 text-xs text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Dispatch Button */}
                      {selectedSurplusItem && selectedSurplusItem.status !== 'delivered' && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-[11px] text-gray-500 font-medium">
                            Contact: {match.receiver.contact_person}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(selectedSurplusItem.id, 'dispatched');
                            }}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#006C4A] hover:bg-[#005238] text-white text-xs font-bold transition shadow-xs"
                          >
                            <span>Dispatch to {match.receiver.name.split(' ')[0]}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Post New Surplus Batch */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white text-[#141B2B] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="px-6 py-4 bg-[#003527] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#82F5C1]" />
                <h2 className="text-base font-bold">List Safe Cooked Surplus Batch</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-300 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSurplus} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cooked Food Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="e.g. Fresh Vegetable Biryani & Raita"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:border-[#006C4A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#006C4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dietary Classification</label>
                  <select
                    value={newDietaryType}
                    onChange={(e) => setNewDietaryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#006C4A] focus:outline-none bg-white"
                  >
                    <option value="Vegetarian">100% Vegetarian</option>
                    <option value="Vegan">Vegan (No Dairy)</option>
                    <option value="Standard Mixed">Standard Mixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Packaging Standard</label>
                  <select
                    value={newPackaging}
                    onChange={(e) => setNewPackaging(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#006C4A] focus:outline-none bg-white"
                  >
                    <option value="Hygienic Steel Sealed (GN 1/1)">Hygienic Steel (GN 1/1)</option>
                    <option value="Food-Grade Insulated Pails">Food-Grade Insulated Pails</option>
                    <option value="Foil Pack Wrapped">Foil Pack Wrapped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Holding Temp (°C)</label>
                  <input
                    type="number"
                    step="1"
                    value={newTempCelsius}
                    onChange={(e) => setNewTempCelsius(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium focus:border-[#006C4A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Safe Consumption Window</label>
                <select
                  value={newHoursAvailable}
                  onChange={(e) => setNewHoursAvailable(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#006C4A] focus:outline-none bg-white"
                >
                  <option value="2.0">Next 2 hours (Urgent)</option>
                  <option value="3.5">Next 3.5 hours (Standard Hot Holding)</option>
                  <option value="5.0">Next 5.0 hours (Chilled / Dry Bread)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-[#003527] leading-relaxed">
                <strong>FSSAI Redirection Protocol:</strong> Only freshly prepared food stored above 60°C or chilled below 5°C qualifies for institutional donation dispatch.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-[#006C4A] hover:bg-[#005238] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting Batch...' : 'Publish & Match Shelters'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
