// FoodWise AI: Redistribution Dispatch & Route Logistics
// Dispatch/logistics software feel: Split screen, selected order details, status lifecycle, secondary route map

import React, { useEffect, useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Navigation,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { MatchRecommendation, Receiver, SurplusListing } from '../types.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import { Badge } from './ui/Badge.tsx';

interface RedistributionViewProps {
  selectedInitialId?: string | null;
}

export const RedistributionView: React.FC<RedistributionViewProps> = ({
  selectedInitialId
}) => {
  const [orders, setOrders] = useState<SurplusListing[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(selectedInitialId || null);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load orders and receivers
  const loadData = async () => {
    try {
      const [surplusRes, receiversRes] = await Promise.all([
        fetch('/api/surplus'),
        fetch('/api/receivers')
      ]);

      const surplusJson = await surplusRes.json();
      const receiversJson = await receiversRes.json();

      if (surplusJson.success) {
        setOrders(surplusJson.surplus);
        if (surplusJson.surplus.length > 0 && !selectedOrderId) {
          setSelectedOrderId(selectedInitialId || surplusJson.surplus[0].id);
        }
      }

      if (receiversJson.success) {
        setReceivers(receiversJson.receivers);
      }
    } catch (err) {
      console.error('[Redistribution load error]', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run match when selected order changes
  useEffect(() => {
    if (!selectedOrderId) return;

    const fetchMatches = async () => {
      setIsMatching(true);
      try {
        const res = await fetch('/api/match-surplus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surplusId: selectedOrderId,
            kitchenLat: 19.0657,
            kitchenLng: 72.8687
          })
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.matches)) {
          setMatches(json.matches);
          if (json.matches.length > 0) {
            setSelectedReceiverId(json.matches[0].receiver.id);
          }
        }
      } catch (err) {
        console.error('[Match fetch error]', err);
      } finally {
        setIsMatching(false);
      }
    };

    fetchMatches();
  }, [selectedOrderId]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const topMatch = matches.find(m => m.receiver.id === selectedReceiverId) || matches[0];

  // Lifecycle status updates: Assign -> Confirm pickup -> Complete
  const handleUpdateStatus = async (newStatus: 'reserved' | 'dispatched' | 'delivered') => {
    if (!selectedOrderId) return;
    setIsUpdatingStatus(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/surplus/${selectedOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setOrders(prev =>
          prev.map(o => (o.id === selectedOrderId ? { ...o, status: newStatus as any } : o))
        );
        setActionMessage(`Order updated to: ${newStatus.toUpperCase()}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error('[Update status error]', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E2]">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#171717] tracking-tight">
            Redistribution Dispatch
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Real-time surplus dispatch, route optimization, and NGO custody verification
          </p>
        </div>

        {actionMessage && (
          <div className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-[#EBF5EE] text-[#1E5631] border border-[#C2E0CC]">
            {actionMessage}
          </div>
        )}
      </div>

      {/* Split Screen Dispatch Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Donation / Order List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E2] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E5E5E2] flex items-center justify-between bg-[#F7F7F5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Dispatch Queue
            </span>
            <span className="text-xs font-mono text-[#666666]">
              {orders.length} orders
            </span>
          </div>

          <div className="divide-y divide-[#EAEAE7] overflow-y-auto max-h-[620px]">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#666666]">
                No surplus orders currently queued.
              </div>
            ) : (
              orders.map(order => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left p-3.5 transition-colors ${
                      isSelected ? 'bg-[#F2F8F4] border-l-2 border-[#1E3A2B]' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-xs text-[#171717]">
                        {order.food_name}
                      </span>
                      <Badge
                        variant={
                          order.status === 'available'
                            ? 'success'
                            : order.status === 'reserved' || (order as any).status === 'matched'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#666666] font-mono mt-1">
                      <span>{order.quantity.toFixed(1)} {order.unit}</span>
                      <span>{order.pickup_location}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Order + Route Details + Secondary Map (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedOrder ? (
            <div className="bg-white border border-[#E5E5E2] rounded-lg p-5 space-y-4">
              {/* Order summary header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E2]">
                <div>
                  <span className="text-[11px] font-mono text-[#666666] uppercase">Selected Order</span>
                  <h2 className="text-base font-semibold text-[#171717]">{selectedOrder.food_name}</h2>
                  <p className="text-xs text-[#666666]">{selectedOrder.dietary_type} · {selectedOrder.packaging_type}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-semibold text-[#171717]">
                    {selectedOrder.quantity.toFixed(1)} {selectedOrder.unit}
                  </span>
                  <p className="text-[11px] text-[#666666]">
                    Holding: {selectedOrder.temperature_celsius ? `${selectedOrder.temperature_celsius}°C` : '65°C'}
                  </p>
                </div>
              </div>

              {/* Operational Dispatch Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#F7F7F5] border border-[#E5E5E2] rounded p-3">
                <div>
                  <span className="block text-[11px] text-[#666666] uppercase">Pickup Dock</span>
                  <span className="font-medium text-[#171717]">{selectedOrder.pickup_location}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#666666] uppercase">Assigned Receiver</span>
                  <span className="font-medium text-[#171717]">
                    {topMatch ? topMatch.receiver.name : 'Awaiting Match'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#666666] uppercase">Distance</span>
                  <span className="font-mono font-medium text-[#171717]">
                    {topMatch ? `${topMatch.distanceKm} km` : '3.2 km'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-[#666666] uppercase">Estimated Travel</span>
                  <span className="font-mono font-medium text-[#171717]">
                    {topMatch ? `${topMatch.estimatedTransitTimeMins} min` : '14 min'}
                  </span>
                </div>
              </div>

              {/* Status lifecycle actions */}
              <div className="pt-2 border-t border-[#E5E5E2] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#666666]">Status:</span>
                  <Badge
                    variant={
                      selectedOrder.status === 'available'
                        ? 'success'
                        : selectedOrder.status === 'reserved' || (selectedOrder as any).status === 'matched'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'available' && (
                    <button
                      onClick={() => handleUpdateStatus('reserved')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors"
                    >
                      Assign
                    </button>
                  )}

                  {(selectedOrder.status === 'reserved' || (selectedOrder as any).status === 'matched') && (
                    <button
                      onClick={() => handleUpdateStatus('dispatched')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors"
                    >
                      Confirm pickup
                    </button>
                  )}

                  {selectedOrder.status === 'dispatched' && (
                    <button
                      onClick={() => handleUpdateStatus('delivered')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors"
                    >
                      Complete
                    </button>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <span className="text-xs font-medium text-[#1E5631] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Redistribution fulfilled
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary Map Component */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-[#666666] mb-1.5">
                  <span className="font-medium text-[#171717] uppercase tracking-wider text-[11px]">
                    Route & GIS Corridor
                  </span>
                  <span className="font-mono text-[11px]">Direct Transit GPS Route</span>
                </div>
                <InteractiveMap
                  receivers={receivers}
                  selectedReceiverId={selectedReceiverId}
                  onSelectReceiver={id => setSelectedReceiverId(id)}
                  kitchenName={selectedOrder.pickup_location}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5E2] rounded-lg p-12 text-center text-xs text-[#666666]">
              Select an order from the dispatch queue to view details and route.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
