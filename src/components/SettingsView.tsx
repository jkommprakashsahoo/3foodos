// FoodWise AI: Operational Settings & System Telemetry
// Enterprise administration: Database infrastructure, scale station settings, verified data boundaries

import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Server,
  Scale,
  Sliders
} from 'lucide-react';
import { DatabaseTelemetry } from '../types.ts';
import { Badge } from './ui/Badge.tsx';

interface SettingsViewProps {
  databaseTelemetry: DatabaseTelemetry | null;
  geminiConfigured: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onRefreshStatus: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  databaseTelemetry,
  geminiConfigured,
  demoMode,
  onToggleDemoMode,
  onRefreshStatus
}) => {
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetData = async () => {
    if (!confirm('Clear all user-confirmed entries and reset database to pristine baseline?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const json = await res.json();
      setResetMessage(json.message || 'Records successfully reset.');
      onRefreshStatus();
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err) {
      console.error('[Reset Error]', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="pb-2 border-b border-[#E5E5E2] flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-[#171717] tracking-tight">
            Settings & System Telemetry
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Database infrastructure status, operational kitchen stations, and system diagnostics
          </p>
        </div>

        <button
          onClick={onRefreshStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[#E5E5E2] bg-white text-[#171717] hover:bg-[#F2F2EF] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#666666]" />
          <span>Refresh</span>
        </button>
      </div>

      {resetMessage && (
        <div className="p-3 bg-[#EBF5EE] border border-[#C2E0CC] rounded text-xs text-[#1E5631] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Database Infrastructure Status */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1E3A2B]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Database Infrastructure
            </h2>
          </div>
          <Badge variant={databaseTelemetry?.connected ? 'success' : 'neutral'}>
            {databaseTelemetry?.connected ? 'ONLINE' : 'LOCAL CACHE'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-[#F7F7F5] border border-[#E5E5E2]">
            <span className="text-[11px] font-medium text-[#666666] uppercase block">Engine</span>
            <span className="text-sm font-semibold text-[#171717] mt-0.5 block">
              {databaseTelemetry?.engine || 'Local In-Memory'}
            </span>
          </div>

          <div className="p-3 rounded bg-[#F7F7F5] border border-[#E5E5E2]">
            <span className="text-[11px] font-medium text-[#666666] uppercase block">Waste Records</span>
            <span className="text-sm font-mono font-semibold text-[#171717] mt-0.5 block">
              {databaseTelemetry?.recordsCount.wasteRecords ?? 0} entries
            </span>
          </div>

          <div className="p-3 rounded bg-[#F7F7F5] border border-[#E5E5E2]">
            <span className="text-[11px] font-medium text-[#666666] uppercase block">Surplus Batches</span>
            <span className="text-sm font-mono font-semibold text-[#171717] mt-0.5 block">
              {databaseTelemetry?.recordsCount.surplusListings ?? 0} active
            </span>
          </div>
        </div>
      </div>

      {/* Model Diagnostics */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#1E3A2B]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Model Services & Processing Engine
            </h2>
          </div>
          <Badge variant={geminiConfigured ? 'success' : 'neutral'}>
            {geminiConfigured ? 'CONNECTED' : 'SIMULATION MODE'}
          </Badge>
        </div>

        <p className="text-xs text-[#555555] leading-relaxed">
          Gemini 2.5 Flash powers zero-shot tray classification and food residue recognition on server-side API proxy endpoints. Physical scale inputs always override vision approximations.
        </p>
      </div>

      {/* Kitchen Station Configuration */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#1E3A2B]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
              Hardware Scale & Camera Stations
            </h2>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded bg-[#F7F7F5] border border-[#E5E5E2]">
            <div>
              <p className="font-medium text-[#171717]">Station #1 — Prep Line Scale</p>
              <p className="text-[11px] text-[#666666]">Mettler Toledo IND231 · COM3</p>
            </div>
            <Badge variant="verified">CALIBRATED</Badge>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-[#F7F7F5] border border-[#E5E5E2]">
            <div>
              <p className="font-medium text-[#171717]">Station #2 — Dish Return Conveyor Scale</p>
              <p className="text-[11px] text-[#666666]">Avery Weigh-Tronix ZK840 · IP 192.168.1.144</p>
            </div>
            <Badge variant="verified">CALIBRATED</Badge>
          </div>
        </div>
      </div>

      {/* Data Maintenance & Sandbox Reset */}
      <div className="bg-white border border-[#E5E5E2] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E2]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9B1C1C]">
            Data Maintenance
          </h2>
        </div>

        <p className="text-xs text-[#666666] leading-relaxed">
          Reset user-logged records to restore pristine sandbox baseline demo states. Historical audit logs will be cleared.
        </p>

        <div className="pt-2">
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="px-3.5 py-1.5 rounded text-xs font-medium border border-[#F8B4B4] bg-[#FDF2F2] text-[#9B1C1C] hover:bg-[#FDE8E8] transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting…' : 'Reset user records to baseline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
