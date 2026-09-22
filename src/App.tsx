// FoodWise AI: Institutional Kitchen Waste & Redistribution Software
// Clean, dense operational interface designed for professional institutional kitchens

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation, NavTab } from './components/Navigation.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ForecastView } from './components/ForecastView.tsx';
import { SurplusView } from './components/SurplusView.tsx';
import { RedistributionView } from './components/RedistributionView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { WasteHistoryView } from './components/WasteHistoryView.tsx';
import { ReceiverPortalView } from './components/ReceiverPortalView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { CameraScannerModal } from './components/CameraScannerModal.tsx';
import { ConfirmWasteModal } from './components/ConfirmWasteModal.tsx';
import { AuthModal, AuthUser } from './components/AuthModal.tsx';
import {
  DatabaseTelemetry,
  SurplusListing,
  UserRole,
  WasteRecord,
  WasteScanResult
} from './types.ts';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Kitchen Manager');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>({
    id: 'usr-arjun-01',
    name: 'Arjun Rao',
    email: 'manager@foodwise.org',
    role: 'Kitchen Manager',
    organization_id: 'org-central-04'
  });
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<WasteScanResult | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  // Selected surplus for redistribution
  const [selectedSurplusForDispatch, setSelectedSurplusForDispatch] = useState<string | null>(null);

  // Data
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [surplusListings, setSurplusListings] = useState<SurplusListing[]>([]);
  const [databaseTelemetry, setDatabaseTelemetry] = useState<DatabaseTelemetry | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [preloadSurplusItem, setPreloadSurplusItem] = useState<{
    name: string;
    quantity: number;
    unit: string;
  } | null>(null);

  // Offline PWA Queue
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Load telemetry & app data
  const refreshAppData = async () => {
    try {
      const [telemetryRes, wasteRes, surplusRes] = await Promise.all([
        fetch('/api/telemetry'),
        fetch(`/api/waste-records?includeDemo=${demoMode}`),
        fetch('/api/surplus')
      ]);

      const teleJson = await telemetryRes.json();
      const wasteJson = await wasteRes.json();
      const surplusJson = await surplusRes.json();

      if (teleJson.success) {
        setDatabaseTelemetry(teleJson.database);
        setGeminiConfigured(teleJson.gemini?.configured ?? false);
      }

      if (wasteJson.success) {
        setWasteRecords(wasteJson.records);
      }

      if (surplusJson.success) {
        setSurplusListings(surplusJson.surplus);
      }
    } catch (err) {
      console.error('[Initial data load error]', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('foodwise_auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setUserRole(data.user.role);
          }
        })
        .catch(() => {});
    }
    refreshAppData();
  }, [demoMode]);

  // Offline detection and sync handler
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      const queue = JSON.parse(localStorage.getItem('foodwise_offline_queue') || '[]');
      setOfflineQueueCount(queue.length);
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const flushOfflineQueue = async () => {
    try {
      const queueStr = localStorage.getItem('foodwise_offline_queue');
      if (!queueStr) return;
      const queue = JSON.parse(queueStr);
      if (queue.length === 0) return;

      for (const item of queue) {
        await fetch('/api/waste-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }

      localStorage.removeItem('foodwise_offline_queue');
      setOfflineQueueCount(0);
      setSyncMessage(`Successfully synchronized ${queue.length} offline waste logs.`);
      setTimeout(() => setSyncMessage(null), 4000);
      refreshAppData();
    } catch (err) {
      console.error('[Offline queue flush error]', err);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    if (role === 'Receiver') {
      setActiveTab('receiver');
    } else if (activeTab === 'receiver') {
      setActiveTab('dashboard');
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'scan') {
      setIsScannerOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleAnalysisComplete = (result: WasteScanResult, imagePreview: string) => {
    setScanResult(result);
    setScannedImage(imagePreview);
    setIsScannerOpen(false);
    setIsConfirmOpen(true);
  };

  const handleRecordSaved = () => {
    refreshAppData();
    setIsConfirmOpen(false);
  };

  const handleOpenSurplusWithItem = (item: { name: string; quantity: number; unit: string }) => {
    setPreloadSurplusItem(item);
    setIsConfirmOpen(false);
    setActiveTab('surplus');
  };

  const handleFindReceiverFromSurplus = (surplusId: string) => {
    setSelectedSurplusForDispatch(surplusId);
    setActiveTab('redistribution');
  };

  const activeSurplusCount = surplusListings.filter(
    s => s.status === 'available' || s.status === 'matched'
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-[#15231b] flex flex-col antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        currentRole={userRole}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        databaseTelemetry={databaseTelemetry}
        geminiConfigured={geminiConfigured}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Offline Alert Banner */}
      {(!isOnline || offlineQueueCount > 0) && (
        <div className="bg-[#171717] text-white px-4 py-2 text-xs flex items-center justify-between z-20 border-b border-[#333333]">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="w-3.5 h-3.5 text-[#E5E5E2]" />
            <span>
              {!isOnline
                ? 'Network disconnected. Operating in offline mode. Weigh-ins stored in local queue.'
                : `${offlineQueueCount} unsynced records waiting in local queue.`}
            </span>
            {isOnline && (
              <button
                onClick={flushOfflineQueue}
                className="ml-auto underline flex items-center gap-1 hover:text-white"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sync Success Toast */}
      {syncMessage && (
        <div className="bg-[#1E3A2B] text-white px-4 py-2 text-xs flex items-center gap-2 justify-center z-20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Layout: Sidebar + Fluid Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          currentRole={userRole}
          surplusCount={activeSurplusCount}
        />

        {/* Fluid Scrollable Content */}
        <main className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full pb-24 lg:pb-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_right,rgba(82,183,136,0.14),transparent_58%)]" />
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={tab => handleSelectTab(tab)}
              onOpenScanner={() => setIsScannerOpen(true)}
              wasteRecords={wasteRecords}
              surplusListings={surplusListings}
              demoMode={demoMode}
            />
          )}

          {activeTab === 'forecast' && <ForecastView />}

          {activeTab === 'history' && (
            <WasteHistoryView onScanNewTray={() => setIsScannerOpen(true)} />
          )}

          {activeTab === 'surplus' && (
            <SurplusView
              onFindReceiver={handleFindReceiverFromSurplus}
              initialPreloadItem={preloadSurplusItem}
              onClearPreloadItem={() => setPreloadSurplusItem(null)}
            />
          )}

          {activeTab === 'redistribution' && (
            <RedistributionView selectedInitialId={selectedSurplusForDispatch} />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'receiver' && <ReceiverPortalView />}

          {activeTab === 'settings' && (
            <SettingsView
              databaseTelemetry={databaseTelemetry}
              geminiConfigured={geminiConfigured}
              demoMode={demoMode}
              onToggleDemoMode={() => setDemoMode(!demoMode)}
              onRefreshStatus={refreshAppData}
            />
          )}
        </main>
      </div>

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        geminiConfigured={geminiConfigured}
      />

      {/* Mandatory Human Scale Weight Confirmation Modal */}
      <ConfirmWasteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        scanResult={scanResult}
        capturedImage={scannedImage}
        onRecordSaved={handleRecordSaved}
        onOpenSurplusWithItem={handleOpenSurplusWithItem}
      />

      {/* Authentication & Staff Role Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          handleRoleChange(user.role);
          refreshAppData();
        }}
        onLogout={() => {
          setCurrentUser(null);
          refreshAppData();
        }}
      />
    </div>
  );
}
