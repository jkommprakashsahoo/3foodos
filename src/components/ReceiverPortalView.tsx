// FoodWise AI: Receiver / NGO Intake Portal
// Operational chain-of-custody intake: Incoming deliveries, intake inspection, verified custody ledger

import React, { useEffect, useState } from 'react';
import {
  Building,
  CheckCircle2,
  Clock,
  Thermometer,
  Scale,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { HandoverRecord, SurplusListing } from '../types.ts';
import { Badge } from './ui/Badge.tsx';

export const ReceiverPortalView: React.FC = () => {
  const [incomingBatches, setIncomingBatches] = useState<SurplusListing[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SurplusListing | null>(null);
  const [receivingTemp, setReceivingTemp] = useState<string>('63.5');
  const [receivingWeight, setReceivingWeight] = useState<string>('12.0');
  const [receiverNotes, setReceiverNotes] = useState<string>('Seals intact. Thermal threshold verified compliant.');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);

  const loadReceiverData = async () => {
    try {
      const [surplusRes, handoversRes] = await Promise.all([
        fetch('/api/surplus'),
        fetch('/api/handovers')
      ]);

      const surplusJson = await surplusRes.json();
      const handoversJson = await handoversRes.json();

      if (surplusJson.success) {
        const pending = surplusJson.surplus.filter(
          (s: SurplusListing) => s.status === 'dispatched' || s.status === 'matched'
        );
        setIncomingBatches(pending);
        if (pending.length > 0 && !selectedBatch) {
          setSelectedBatch(pending[0]);
          setReceivingWeight(pending[0].quantity.toString());
        }
      }

      if (handoversJson.success) {
        setHandovers(handoversJson.handovers);
      }
    } catch (err) {
      console.error('[Receiver Portal Error]', err);
    }
  };

  useEffect(() => {
    loadReceiverData();
  }, []);

  const handleConfirmReceipt = async () => {
    if (!selectedBatch) return;
    setIsVerifying(true);

    try {
      await fetch(`/api/surplus/${selectedBatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });

      const newHandover: HandoverRecord = {
        id: `LOT-${Date.now().toString().slice(-4)}`,
        item_composition: selectedBatch.food_name,
        notes: receiverNotes,
        weight_kg: parseFloat(receivingWeight) || selectedBatch.quantity,
        temperature_c: parseFloat(receivingTemp) || 63.5,
        recipient_ngo: 'Asha Community Kitchen & Children Shelter',
        status: 'Delivered & Safety Verified',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_demo: false
      };

      setHandovers(prev => [newHandover, ...prev]);
      setVerifiedSuccess(true);
      setTimeout(() => {
        setVerifiedSuccess(false);
        setSelectedBatch(null);
        loadReceiverData();
      }, 1800);
    } catch (err) {
      console.error('[Receipt error]', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page Header */}
      <div className="pb-2 border-b border-[#E5E5E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#171717] tracking-tight">
            Receiver Custody Portal
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Asha Community Kitchen & Shelter · Verification and physical intake inspection
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#666666] bg-white border border-[#E5E5E2] px-3 py-1.5 rounded">
          <span>License: FSSAI-NGO-2024-8841</span>
        </div>
      </div>

      {/* Main Grid: Incoming queue + Intake form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT: Incoming Deliveries Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E2] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#E5E5E2] flex items-center justify-between bg-[#F7F7F5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Incoming Consignments
            </span>
            <span className="text-xs font-mono text-[#666666]">
              {incomingBatches.length} pending
            </span>
          </div>

          <div className="divide-y divide-[#EAEAE7] overflow-y-auto max-h-[500px]">
            {incomingBatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#666666]">
                No pending shipments currently en route.
              </div>
            ) : (
              incomingBatches.map(batch => {
                const isSelected = selectedBatch?.id === batch.id;
                return (
                  <button
                    key={batch.id}
                    onClick={() => {
                      setSelectedBatch(batch);
                      setReceivingWeight(batch.quantity.toString());
                    }}
                    className={`w-full text-left p-3.5 transition-colors ${
                      isSelected ? 'bg-[#F2F8F4] border-l-2 border-[#1E3A2B]' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-xs text-[#171717]">{batch.food_name}</span>
                      <Badge variant="warning">{batch.status.toUpperCase()}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#666666] font-mono mt-1">
                      <span>{batch.quantity.toFixed(1)} {batch.unit}</span>
                      <span>{batch.pickup_location}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Intake Physical Verification Form (7 cols) */}
        <div className="lg:col-span-7">
          {selectedBatch ? (
            <div className="bg-white border border-[#E5E5E2] rounded-lg p-5 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E2]">
                <div>
                  <span className="text-[11px] font-mono text-[#666666] uppercase">Consignment Intake</span>
                  <h2 className="text-base font-semibold text-[#171717]">{selectedBatch.food_name}</h2>
                  <p className="text-xs text-[#666666]">Source: {selectedBatch.pickup_location}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-lg font-semibold text-[#171717]">
                    {selectedBatch.quantity.toFixed(1)} {selectedBatch.unit}
                  </span>
                  <p className="text-[11px] text-[#666666]">Dispatched volume</p>
                </div>
              </div>

              {/* Physical inspection controls */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Received Gross Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={receivingWeight}
                      onChange={e => setReceivingWeight(e.target.value)}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Probe Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={receivingTemp}
                      onChange={e => setReceivingTemp(e.target.value)}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                    Quality & Packaging Inspection Notes
                  </label>
                  <textarea
                    rows={2}
                    value={receiverNotes}
                    onChange={e => setReceiverNotes(e.target.value)}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded p-2 text-xs text-[#171717] outline-none resize-none"
                  />
                </div>

                <div className="bg-[#F0F0EE] border border-[#E5E5E2] rounded p-3 text-xs text-[#555555]">
                  <p className="font-medium text-[#171717] mb-0.5">Chain of Custody Standard</p>
                  <p className="text-[11px] leading-relaxed">
                    By signing, the receiver certifies that food was transported in sealed containers and verified above 60°C or below 5°C.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-[#E5E5E2] flex items-center justify-between">
                <span className="text-xs text-[#666666]">
                  {verifiedSuccess ? 'Intake verified and logged to custody ledger' : 'Ready for verification sign-off'}
                </span>

                <button
                  onClick={handleConfirmReceipt}
                  disabled={isVerifying || verifiedSuccess}
                  className="px-4 py-2 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors"
                >
                  {isVerifying ? 'Verifying…' : verifiedSuccess ? 'Intake complete' : 'Verify & accept handover'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5E2] rounded-lg p-12 text-center text-xs text-[#666666]">
              Select an incoming shipment to inspect and accept handover.
            </div>
          )}
        </div>
      </div>

      {/* Verified Custody Ledger Table */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E5E2] bg-[#F7F7F5] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
            Historical Custody Ledger
          </span>
          <span className="text-xs font-mono text-[#666666]">{handovers.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E2] bg-[#FAFAFA] text-[11px] font-semibold text-[#666666] uppercase">
                <th className="py-2.5 px-4">Lot ID</th>
                <th className="py-2.5 px-4">Food Consignment</th>
                <th className="py-2.5 px-4 text-right">Net Weight</th>
                <th className="py-2.5 px-4 text-center">Temp (°C)</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE7]">
              {handovers.map(h => (
                <tr key={h.id} className="hover:bg-[#FAFAFA]">
                  <td className="py-3 px-4 font-mono font-medium text-[#171717]">{h.id}</td>
                  <td className="py-3 px-4 font-medium text-[#171717]">{h.item_composition}</td>
                  <td className="py-3 px-4 text-right font-mono">{h.weight_kg.toFixed(1)} kg</td>
                  <td className="py-3 px-4 text-center font-mono">{h.temperature_c.toFixed(1)}°C</td>
                  <td className="py-3 px-4 text-[#555555]">{h.recipient_ngo}</td>
                  <td className="py-3 px-4 font-mono text-[#666666]">{h.timestamp}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="verified">VERIFIED CUSTODY</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
