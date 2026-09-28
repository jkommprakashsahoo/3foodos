// FoodWise AI: Operational Settings & System Telemetry
// Enterprise administration: Database infrastructure, scale station settings, verified data boundaries

import React, { useState } from 'react';
import { Database, RefreshCw, Trash2, CheckCircle2, Server } from 'lucide-react';
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
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetData = async () => {
    if (!confirm('Clear all user-confirmed entries and reset database to pristine baseline?')) return;
    setIsResetting(true);
    setResetError(null);
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Unable to reset records.');
      setResetMessage(json.message || 'Records successfully reset.');
      await onRefreshStatus();
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Unable to reset records.');
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
      {resetError && <div role="alert" className="rounded-md border border-[#efc7c1] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#87372b]">{resetError}</div>}

      <section className="flex flex-col gap-3 rounded-lg border border-[#e2e6e1] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#202821]">Demo mode</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68736a]">
            {demoMode ? 'Demo data is being displayed alongside verified records.' : 'Only verified operational records are requested.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={demoMode}
          onClick={onToggleDemoMode}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315a3a] ${demoMode ? 'border-[#315a3a] bg-[#315a3a]' : 'border-[#bcc5bc] bg-[#e7ebe7]'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${demoMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </section>

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
            {databaseTelemetry ? (databaseTelemetry.connected ? 'ONLINE' : 'LOCAL CACHE') : 'STATUS UNAVAILABLE'}
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
              {databaseTelemetry?.recordsCount?.wasteRecords ??
                ((databaseTelemetry?.totalVerifiedWasteRecords ?? 0) +
                  (databaseTelemetry?.totalDemoWasteRecords ?? 0))} entries
            </span>
          </div>

          <div className="p-3 rounded bg-[#F7F7F5] border border-[#E5E5E2]">
            <span className="text-[11px] font-medium text-[#666666] uppercase block">Surplus Batches</span>
            <span className="text-sm font-mono font-semibold text-[#171717] mt-0.5 block">
              {databaseTelemetry?.recordsCount?.surplusListings ?? 0} active
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
            {geminiConfigured ? 'CONNECTED' : 'NOT CONFIGURED'}
          </Badge>
        </div>

        <p className="text-xs text-[#555555] leading-relaxed">
          Gemini vision powers server-side tray classification and food residue recognition through a protected API proxy. Physical scale inputs always override vision approximations; the model never writes a weight directly to the registry.
        </p>
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
