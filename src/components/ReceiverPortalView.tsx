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
import { listHandovers } from '../services/redistribution.ts';
import { completeSurplusHandover, listSurplus } from '../services/surplus.ts';

interface ReceiverPortalViewProps {
  demoMode: boolean;
}

export const ReceiverPortalView: React.FC<ReceiverPortalViewProps> = ({ demoMode }) => {
  const [incomingBatches, setIncomingBatches] = useState<SurplusListing[]>([]);
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SurplusListing | null>(null);
  const [receivingTemp, setReceivingTemp] = useState('');
  const [receivingWeight, setReceivingWeight] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverNotes, setReceiverNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReceiverData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [surplusData, handoverData] = await Promise.all([
        listSurplus(demoMode),
        listHandovers(demoMode)
      ]);
      const pending = surplusData.surplus.filter(
        (s: SurplusListing) => s.status === 'dispatched' || s.status === 'matched'
      );
      setIncomingBatches(pending);
      if (pending.length > 0 && !selectedBatch) {
          setSelectedBatch(pending[0]);
          setReceivingWeight('');
      }
      setHandovers(handoverData.handovers);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load receiver data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReceiverData();
  }, [demoMode]);

  const handleConfirmReceipt = async () => {
    if (!selectedBatch) return;
    const weight = Number(receivingWeight);
    const temperature = Number(receivingTemp);
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(temperature) || temperature < -30 || temperature > 100 || !receiverName.trim()) {
      setErrorMessage('Enter the measured received weight, probe temperature, and receiver organization before completing intake.');
      return;
    }
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await completeSurplusHandover({
        id: selectedBatch.id,
        weightKg: weight,
        temperatureCelsius: temperature,
        receiverName: receiverName.trim(),
        notes: receiverNotes.trim()
      });
      setVerifiedSuccess(true);
      setTimeout(() => {
        setVerifiedSuccess(false);
        setSelectedBatch(null);
        void loadReceiverData();
      }, 1800);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to confirm receipt.');
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
          <p className="text-xs text-[#666666] mt-0.5">Verify received weight and food temperature, then record the handover.</p>
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
            {isLoading && <p role="status" className="p-8 text-center text-sm text-[#68736a]">Loading incoming consignments…</p>}
            {!isLoading && incomingBatches.length === 0 && (
              <div className="p-8 text-center text-xs text-[#666666]">
                No pending shipments currently en route.
              </div>
            )}
            {!isLoading && incomingBatches.length > 0 && (
              incomingBatches.map(batch => {
                const isSelected = selectedBatch?.id === batch.id;
                return (
                  <button
                    key={batch.id}
                    onClick={() => {
                      setSelectedBatch(batch);
                      setReceivingWeight('');
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
              {errorMessage && <div role="alert" className="rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#87372b]">{errorMessage}</div>}
              {demoMode && <Badge variant="demo">Demo data included</Badge>}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                      Received Gross Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
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
                      min="-30"
                      max="100"
                      required
                      value={receivingTemp}
                      onChange={e => setReceivingTemp(e.target.value)}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">Receiver organization</label>
                  <input required value={receiverName} onChange={event => setReceiverName(event.target.value)} className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717]" />
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
                    Record actual intake measurements and follow applicable food-safety procedures. FoodWise does not certify safety.
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
