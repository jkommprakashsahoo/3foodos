// FoodWise AI: Surplus Food Inventory Management
// Logistics application feel: Clean table, time expiration indicators, fast actions

import React, { useEffect, useState } from 'react';
import {
  PackageCheck,
  Plus,
  Clock,
  MapPin,
  Thermometer,
  ArrowRight,
  Search,
  Filter,
  X
} from 'lucide-react';
import { SurplusListing } from '../types.ts';
import { Badge } from './ui/Badge.tsx';

interface SurplusViewProps {
  onFindReceiver: (surplusId: string) => void;
  initialPreloadItem?: { name: string; quantity: number; unit: string } | null;
  onClearPreloadItem?: () => void;
}

export const SurplusView: React.FC<SurplusViewProps> = ({
  onFindReceiver,
  initialPreloadItem,
  onClearPreloadItem
}) => {
  const [listings, setListings] = useState<SurplusListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New surplus form
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('10.0');
  const [temperature, setTemperature] = useState('65.0');
  const [packaging, setPackaging] = useState('Hygienic Steel Sealed (GN 1/1)');
  const [dietaryType, setDietaryType] = useState('Vegetarian');
  const [hoursAvailable, setHoursAvailable] = useState('3.0');
  const [pickupLocation, setPickupLocation] = useState('Central Kitchen Dock #2');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSurplus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/surplus');
      const data = await res.json();
      if (data.success) {
        setListings(data.surplus);
      }
    } catch (err) {
      console.error('[Surplus load error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurplus();
  }, []);

  // Handle preloaded item from waste scan
  useEffect(() => {
    if (initialPreloadItem) {
      setFoodName(initialPreloadItem.name);
      setQuantity(initialPreloadItem.quantity.toString());
      setShowCreateModal(true);
      onClearPreloadItem?.();
    }
  }, [initialPreloadItem]);

  const handleCreateSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !quantity) {
      setErrorMessage('Please provide food item name and quantity.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage('Quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const availableDate = new Date(Date.now() + parseFloat(hoursAvailable) * 3600 * 1000);

      const res = await fetch('/api/surplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: foodName,
          quantity: qtyNum,
          unit: 'kg',
          temperature_celsius: parseFloat(temperature) || 65.0,
          packaging_type: packaging,
          dietary_type: dietaryType,
          available_until: availableDate.toISOString(),
          pickup_location: pickupLocation,
          notes: notes || 'Prepared under temperature supervision'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to list surplus batch.');
      }

      setShowCreateModal(false);
      setFoodName('');
      fetchSurplus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating surplus listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time remaining
  const getTimeRemaining = (isoStr: string) => {
    const diff = new Date(isoStr).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const filteredListings = listings.filter(item => {
    const matchesSearch =
      item.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pickup_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E2]">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#171717] tracking-tight">
            Surplus Inventory
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Institutional surplus food ready for verified redistribution to certified receiver shelters
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create surplus listing</span>
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search surplus batch..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded pl-8 pr-2.5 py-1.5 text-xs text-[#171717] placeholder-[#888888] outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <span className="text-xs font-mono text-[#666666]">
          {filteredListings.length} batches listed
        </span>
      </div>

      {/* Logistics Table */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E2] bg-[#F7F7F5] text-[11px] font-semibold text-[#666666] uppercase tracking-wider">
                <th className="py-2.5 px-4">Food Item</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4">Available Until</th>
                <th className="py-2.5 px-4">Dispatch Location</th>
                <th className="py-2.5 px-4 text-center">Temp / Packaging</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE7] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#666666]">
                    Loading surplus inventory…
                  </td>
                </tr>
              ) : filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#666666]">
                    <p className="font-medium text-[#171717] mb-1">No surplus listings found</p>
                    <p className="text-xs text-[#666666] mb-3">
                      Surplus batches logged from the kitchen will appear here for redistribution dispatch.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] text-white"
                    >
                      Create listing
                    </button>
                  </td>
                </tr>
              ) : (
                filteredListings.map(item => {
                  const timeLeft = getTimeRemaining(item.available_until);
                  const isAvailable = item.status === 'available';

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#171717]">
                        <div>
                          <span>{item.food_name}</span>
                          <span className="block text-[11px] text-[#666666]">{item.dietary_type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#171717]">
                        {item.quantity.toFixed(1)} {item.unit}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Clock className="w-3.5 h-3.5 text-[#888888]" />
                          <span
                            className={
                              timeLeft === 'Expired'
                                ? 'text-[#9B1C1C]'
                                : 'text-[#171717]'
                            }
                          >
                            {timeLeft}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#555555] truncate max-w-[180px]">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                          <span>{item.pickup_location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E2] text-[#444444]">
                          {item.temperature_celsius ? `${item.temperature_celsius}°C` : 'Amb'} · {item.packaging_type.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            item.status === 'available'
                              ? 'success'
                              : item.status === 'reserved' || (item as any).status === 'matched'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAvailable ? (
                          <button
                            onClick={() => onFindReceiver(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white transition-colors"
                          >
                            <span>Find receiver</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onFindReceiver(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#171717] hover:bg-[#F2F2EF] transition-colors"
                          >
                            <span>View dispatch</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Surplus Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5E2] rounded-lg w-full max-w-lg shadow-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-3.5 border-b border-[#E5E5E2] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#171717]">Create Surplus Listing</h3>
                <p className="text-xs text-[#666666]">List institutional surplus for receiver matching</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-[#666666] hover:bg-[#F0F0EE]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSurplus} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                  Food Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Basmati Rice & Dal"
                  value={foodName}
                  onChange={e => setFoodName(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Holding Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Dietary Classification
                  </label>
                  <select
                    value={dietaryType}
                    onChange={e => setDietaryType(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Available For (Hours)
                  </label>
                  <select
                    value={hoursAvailable}
                    onChange={e => setHoursAvailable(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                  >
                    <option value="2.0">2.0 hours (immediate)</option>
                    <option value="3.5">3.5 hours (standard FSSAI)</option>
                    <option value="5.0">5.0 hours (chilled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                  Packaging Specification
                </label>
                <select
                  value={packaging}
                  onChange={e => setPackaging(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                >
                  <option value="Hygienic Steel Sealed (GN 1/1)">Hygienic Steel Sealed (GN 1/1)</option>
                  <option value="Food-Grade Heat-Sealed Poly Pouch">Food-Grade Heat-Sealed Poly Pouch</option>
                  <option value="Insulated Bulk Thermal Container">Insulated Bulk Thermal Container</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                  Pickup Dock / Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C]">
                  {errorMessage}
                </div>
              )}

              <div className="pt-3 border-t border-[#E5E5E2] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#666666] hover:bg-[#F2F2EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40"
                >
                  {isSubmitting ? 'Listing…' : 'Publish surplus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
