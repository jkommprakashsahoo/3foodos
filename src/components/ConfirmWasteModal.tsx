// FoodWise AI: Operational Waste Confirmation Form
// Professional enterprise form with detected food list, waste levels, physical scale inputs, and "Review before saving" callout

import React, { useEffect, useState } from 'react';
import { X, Scale, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { DetectedFoodWasteItem, WasteScanResult } from '../types.ts';
import { Badge } from './ui/Badge.tsx';
import { createWasteRecord } from '../services/waste.ts';

interface ConfirmWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: WasteScanResult | null;
  capturedImage: string | null;
  onRecordSaved: () => void;
  onOpenSurplusWithItem: (item: { name: string; quantity: number; unit: string }) => void;
}

export const ConfirmWasteModal: React.FC<ConfirmWasteModalProps> = ({
  isOpen,
  onClose,
  scanResult,
  capturedImage,
  onRecordSaved,
  onOpenSurplusWithItem
}) => {
  // Extract detected items or provide standard defaults
  const detectedItems: DetectedFoodWasteItem[] = scanResult?.foodItems || [];

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [wasteLevels, setWasteLevels] = useState<Record<string, 'high' | 'medium' | 'low'>>({});

  const [shift, setShift] = useState<string>('Lunch');
  const [station, setStation] = useState<string>('Station #2 Dish Return Scale');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuantities(Object.fromEntries(detectedItems.map(item => [item.name, ''])));
    setWasteLevels(Object.fromEntries(detectedItems.map(item => [item.name, item.wasteLevel])));
    setIsConfirmed(false);
    setErrorMessage(null);
  }, [scanResult]);

  if (!isOpen) return null;

  const handleQuantityChange = (itemName: string, value: string) => {
    setQuantities(prev => ({ ...prev, [itemName]: value }));
  };

  const handleWasteLevelChange = (itemName: string, level: 'high' | 'medium' | 'low') => {
    setWasteLevels(prev => ({ ...prev, [itemName]: level }));
  };

  const handleSave = async () => {
    setErrorMessage(null);

    // Validate quantities
    const itemsToSave: Array<{ name: string; qty: number; level: 'high' | 'medium' | 'low' }> = [];
    for (const item of detectedItems) {
      const valStr = quantities[item.name];
      if (valStr && valStr.trim() !== '') {
        const num = parseFloat(valStr);
        if (isNaN(num) || num <= 0) {
          setErrorMessage(`Please enter a valid scale quantity greater than 0 kg for ${item.name}.`);
          return;
        }
        itemsToSave.push({
          name: item.name,
          qty: num,
          level: wasteLevels[item.name] || item.wasteLevel || 'medium'
        });
      }
    }

    if (itemsToSave.length === 0) {
      setErrorMessage('Please enter at least one verified scale quantity.');
      return;
    }

    if (!isConfirmed) {
      setErrorMessage('Please verify that values are confirmed from the physical scale.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save records sequentially
      for (const entry of itemsToSave) {
        await createWasteRecord({
          food_name: entry.name,
          user_confirmed_quantity: entry.qty,
          unit: 'kg',
          waste_level: entry.level,
          service_shift: shift,
          station_name: station,
          notes: `Recorded at ${station}`,
          image_url: null,
          ai_analysis_json: scanResult,
          is_demo: false
        });
      }

      onRecordSaved();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving waste records.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryItemName = detectedItems[0]?.name || 'Steamed Basmati Rice';
  const primaryItemQty = parseFloat(quantities[primaryItemName] || '0');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5E2] rounded-lg w-full max-w-lg shadow-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E5E2] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">Record Food Waste</h2>
            <p className="text-xs text-[#666666]">Step 2: Review and verify scale weights</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#666666] hover:bg-[#F0F0EE] hover:text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {!detectedItems.length && (
            <div role="alert" className="rounded-md border border-[#e9c9a6] bg-[#fff8ee] p-3 text-sm text-[#765124]">
              The analysis did not identify food items. Retake a clearer image or close this form; no quantities have been prefilled.
            </div>
          )}
          {/* Shift and Station Controls */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                Shift
              </label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#666666] uppercase mb-1">
                Scale Station
              </label>
              <select
                value={station}
                onChange={e => setStation(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded px-2.5 py-1.5 text-xs text-[#171717] outline-none"
              >
                <option value="Station #2 Dish Return Scale">Station #2 Dish Return Scale</option>
                <option value="Station #1 Prep Kitchen">Station #1 Prep Kitchen</option>
                <option value="Station #3 Pot Wash Waste Bin">Station #3 Pot Wash Waste Bin</option>
              </select>
            </div>
          </div>

          {/* Detected Food & Scale Weight Inputs */}
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#E5E5E2]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                Detected Food Items
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                Scale Weight
              </span>
            </div>

            <div className="space-y-3">
              {detectedItems.map(item => (
                <div
                  key={item.name}
                  className="p-2.5 rounded border border-[#E5E5E2] bg-[#F7F7F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div>
                    <p className="font-medium text-[#171717]">{item.name}</p>
                    {/* Waste level selector */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-[#666666]">Level:</span>
                      {(['low', 'medium', 'high'] as const).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleWasteLevelChange(item.name, lvl)}
                          className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-medium border transition-colors ${
                            wasteLevels[item.name] === lvl
                              ? lvl === 'high'
                                ? 'bg-[#FDF2F2] text-[#9B1C1C] border-[#F8B4B4]'
                                : lvl === 'medium'
                                ? 'bg-[#FEF7EC] text-[#975A16] border-[#FBD38D]'
                                : 'bg-[#EBF5EE] text-[#1E5631] border-[#C2E0CC]'
                              : 'bg-white text-[#777777] border-[#E5E5E2]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verified quantity input */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quantities[item.name] || ''}
                      onChange={e => handleQuantityChange(item.name, e.target.value)}
                      placeholder="0.0"
                      className="w-20 bg-white border border-[#E5E5E2] rounded px-2.5 py-1 text-xs text-right font-mono font-medium text-[#171717] outline-none"
                    />
                    <span className="text-xs font-mono text-[#666666]">kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Callout: Review before saving */}
          <div className="bg-[#F0F0EE] border border-[#E5E5E2] rounded p-3 text-xs text-[#555555]">
            <p className="font-medium text-[#171717] mb-0.5">Human confirmation required</p>
            <p className="text-[11px] leading-relaxed">
            Visual assessment does not determine weight. Enter quantities from the kitchen scale; these operator-confirmed values are what will be saved.
            </p>
          </div>

          {/* Checkbox verification */}
          <label className="flex items-start gap-2 cursor-pointer text-xs text-[#171717]">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={e => setIsConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-[#CCCCCC] text-[#1E3A2B] focus:ring-[#1E3A2B]"
            />
            <span className="text-[11px] text-[#555555]">
              I confirm these measurements were obtained from calibrated scale readouts.
            </span>
          </label>

          {/* Error message */}
          {errorMessage && (
            <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C]">
              {errorMessage}
            </div>
          )}

          {/* Optional: Redistribution surplus shortcut if unconsumed */}
          {primaryItemQty >= 5.0 && (
            <div className="pt-2 border-t border-[#E5E5E2] flex items-center justify-between text-xs">
              <span className="text-[#666666]">Large batch ({primaryItemQty} kg). Safe for redistribution?</span>
              <button
                type="button"
                onClick={() =>
                  onOpenSurplusWithItem({
                    name: primaryItemName,
                    quantity: primaryItemQty,
                    unit: 'kg'
                  })
                }
                className="text-[#1E3A2B] font-medium hover:underline flex items-center gap-1"
              >
                <span>List as surplus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E5E5E2] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#666666] hover:bg-[#F2F2EF] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded text-xs font-medium bg-[#1E3A2B] hover:bg-[#162E22] text-white disabled:opacity-40 transition-colors"
          >
            {isSubmitting ? 'Saving record…' : 'Save record'}
          </button>
        </div>
      </div>
    </div>
  );
};
