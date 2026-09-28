// FoodWise AI: Institutional Kitchen Waste & Redistribution Software
// Clean, dense operational interface designed for professional institutional kitchens

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation, NavTab } from './components/Navigation.tsx';
import { LoginView } from './components/LoginView.tsx';
import type { AuthUser } from './components/AuthModal.tsx';
import {
  DatabaseTelemetry,
  SurplusListing,
  UserRole,
  WasteRecord,
  WasteScanResult
} from './types.ts';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getCurrentUser, signOut } from './services/auth.ts';
import { ApiError, apiRequest } from './services/apiClient.ts';
import { getTelemetry } from './services/dashboard.ts';
import { listSurplus } from './services/surplus.ts';
import { listWasteRecords } from './services/waste.ts';

const DashboardView = lazy(() => import('./components/DashboardView.tsx').then(module => ({ default: module.DashboardView })));
const ForecastView = lazy(() => import('./components/ForecastView.tsx').then(module => ({ default: module.ForecastView })));
const SurplusView = lazy(() => import('./components/SurplusView.tsx').then(module => ({ default: module.SurplusView })));
const RedistributionView = lazy(() => import('./components/RedistributionView.tsx').then(module => ({ default: module.RedistributionView })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView.tsx').then(module => ({ default: module.AnalyticsView })));
const WasteHistoryView = lazy(() => import('./components/WasteHistoryView.tsx').then(module => ({ default: module.WasteHistoryView })));
const ReceiverPortalView = lazy(() => import('./components/ReceiverPortalView.tsx').then(module => ({ default: module.ReceiverPortalView })));
const SettingsView = lazy(() => import('./components/SettingsView.tsx').then(module => ({ default: module.SettingsView })));
const ProductionView = lazy(() => import('./components/ProductionView.tsx').then(module => ({ default: module.ProductionView })));
const CameraScannerModal = lazy(() => import('./components/CameraScannerModal.tsx').then(module => ({ default: module.CameraScannerModal })));
const ConfirmWasteModal = lazy(() => import('./components/ConfirmWasteModal.tsx').then(module => ({ default: module.ConfirmWasteModal })));
const AuthModal = lazy(() => import('./components/AuthModal.tsx').then(module => ({ default: module.AuthModal })));

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Kitchen Manager');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(() => localStorage.getItem("foodwise_demo_mode") === "true");

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
  const [appDataError, setAppDataError] = useState<string | null>(null);
  const [wasteSearchTerm, setWasteSearchTerm] = useState('');
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
    const results = await Promise.allSettled([
      getTelemetry(),
      listWasteRecords(demoMode),
      listSurplus(demoMode)
    ]);
    const failures: string[] = [];

    if (results[0].status === 'fulfilled') {
      setDatabaseTelemetry(results[0].value.database);
      setGeminiConfigured(results[0].value.gemini.configured);
    } else failures.push('system status');
    if (results[1].status === 'fulfilled') setWasteRecords(results[1].value.records);
    else failures.push('waste records');
    if (results[2].status === 'fulfilled') setSurplusListings(results[2].value.surplus);
    else failures.push('surplus listings');

    setAppDataError(
      failures.length ? `Unable to load ${failures.join(', ')}. Check the connection and retry.` : null
    );
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem('foodwise_auth_token')) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const result = await getCurrentUser();
        setCurrentUser(result.user);
        setUserRole(result.user.role);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          signOut();
        } else {
          setAuthError(error instanceof Error ? error.message : 'Unable to restore your session.');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('foodwise_demo_mode', String(demoMode));
    if (currentUser) void refreshAppData();
  }, [currentUser, demoMode]);

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
      if (Array.isArray(queue)) setOfflineQueueCount(queue.length);
    } catch {
      localStorage.removeItem('foodwise_offline_queue');
    }

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
      if (!Array.isArray(queue)) throw new Error('Offline queue data is invalid.');
      if (queue.length === 0) return;

      for (const item of queue) {
        await apiRequest('/api/waste-records', {
          method: 'POST',
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
      setSyncMessage('Some offline records could not be synchronized. They remain queued for retry.');
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
    } else if (tab === 'waste') {
      setActiveTab('history');
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

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f8f8f6]">
        <p className="text-sm text-[#66736b]" role="status">Checking your FoodWise session…</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        initialError={authError}
        onSuccess={user => {
          setAuthError(null);
          setCurrentUser(user);
          handleRoleChange(user.role);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6] text-[#202821] flex flex-col antialiased">
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
        onOpenScanner={() => setIsScannerOpen(true)}
        onSearch={term => {
          setWasteSearchTerm(term);
          setActiveTab('history');
        }}
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
          {appDataError && (
            <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-[#e9c9a6] bg-[#fff8ee] px-3 py-2.5 text-sm text-[#765124]">
              <span>{appDataError}</span>
              <button onClick={() => void refreshAppData()} className="font-medium underline underline-offset-2">Retry</button>
            </div>
          )}
          <Suspense fallback={<div className="grid min-h-64 place-items-center text-sm text-[#68736a]" role="status">Loading this workspace…</div>}>
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={tab => handleSelectTab(tab)}
              onOpenScanner={() => setIsScannerOpen(true)}
              wasteRecords={wasteRecords}
              surplusListings={surplusListings}
              demoMode={demoMode}
            />
          )}

          {activeTab === 'forecast' && <ForecastView demoMode={demoMode} />}

          {activeTab === 'history' && (
            <WasteHistoryView
              onScanNewTray={() => setIsScannerOpen(true)}
              demoMode={demoMode}
              initialSearch={wasteSearchTerm}
            />
          )}
          {activeTab === 'production' && <ProductionView demoMode={demoMode} />}

          {activeTab === 'surplus' && (
            <SurplusView
              onFindReceiver={handleFindReceiverFromSurplus}
              initialPreloadItem={preloadSurplusItem}
              onClearPreloadItem={() => setPreloadSurplusItem(null)}
              demoMode={demoMode}
            />
          )}

          {activeTab === 'redistribution' && (
            <RedistributionView selectedInitialId={selectedSurplusForDispatch} demoMode={demoMode} />
          )}

          {activeTab === 'analytics' && <AnalyticsView demoMode={demoMode} />}

          {activeTab === 'receiver' && <ReceiverPortalView demoMode={demoMode} />}

          {activeTab === 'settings' && (
            <SettingsView
              databaseTelemetry={databaseTelemetry}
              geminiConfigured={geminiConfigured}
              demoMode={demoMode}
              onToggleDemoMode={() => setDemoMode(!demoMode)}
              onRefreshStatus={refreshAppData}
            />
          )}
          {['operations', 'organizations', 'users', 'help'].includes(activeTab) && (
            <section className="max-w-2xl rounded-lg border border-[#e2e6e1] bg-white p-5">
              <h1 className="text-lg font-semibold">{activeTab === 'help' ? 'Help' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
              <p className="mt-2 text-sm leading-6 text-[#68736a]">This workspace area is not connected to an operational API yet. No organization or user records are being simulated.</p>
            </section>
          )}
          </Suspense>
        </main>
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && <Suspense fallback={null}><CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAnalysisComplete={handleAnalysisComplete}
        geminiConfigured={geminiConfigured}
        demoMode={demoMode}
      /></Suspense>}

      {/* Mandatory Human Scale Weight Confirmation Modal */}
      {isConfirmOpen && <Suspense fallback={null}><ConfirmWasteModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        scanResult={scanResult}
        capturedImage={scannedImage}
        onRecordSaved={handleRecordSaved}
        onOpenSurplusWithItem={handleOpenSurplusWithItem}
      /></Suspense>}

      {/* Authentication & Staff Role Modal */}
      {isAuthOpen && <Suspense fallback={null}><AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          handleRoleChange(user.role);
          refreshAppData();
        }}
        onLogout={() => {
          signOut();
          setCurrentUser(null);
        }}
      /></Suspense>}
    </div>
  );
}
