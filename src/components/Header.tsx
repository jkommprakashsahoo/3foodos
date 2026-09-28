import React, { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import type { DatabaseTelemetry, UserRole } from '../types.ts';
import type { AuthUser } from './AuthModal.tsx';
import type { NavTab } from './Navigation.tsx';

interface HeaderProps {
  activeTab: NavTab;
  currentRole: UserRole;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  databaseTelemetry: DatabaseTelemetry | null;
  geminiConfigured: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenSettings: () => void;
  onOpenScanner: () => void;
  onSearch: (term: string) => void;
}

const pageTitles: Partial<Record<NavTab, string>> = {
  dashboard: 'Overview',
  waste: 'Waste',
  history: 'Waste records',
  scan: 'Waste',
  forecast: 'Demand forecast',
  production: 'Production plan',
  surplus: 'Surplus food',
  redistribution: 'Redistribution',
  analytics: 'Analytics',
  operations: 'Operations',
  organizations: 'Organizations',
  users: 'Users',
  settings: 'Settings',
  help: 'Help',
  receiver: 'Receiver portal'
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentRole,
  currentUser,
  onOpenAuth,
  demoMode,
  onToggleDemoMode,
  onOpenScanner,
  onSearch
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e2e6e1] bg-white px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#315a3a] text-xs font-bold text-white" aria-hidden="true">FW</span>
        <span className="hidden text-sm font-semibold tracking-[0.08em] sm:inline">FOODWISE</span>
        <span className="h-5 w-px shrink-0 bg-[#e2e6e1]" />
        <span className="truncate text-sm font-semibold" aria-label="Current page">{pageTitles[activeTab] || 'Overview'}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <form
          onSubmit={event => {
            event.preventDefault();
            if (searchTerm.trim()) onSearch(searchTerm.trim());
          }}
          role="search"
          className="hidden h-9 w-48 items-center gap-2 rounded-md border border-[#dfe4df] px-2.5 md:flex"
        >
          <Search className="h-4 w-4 shrink-0 text-[#68736a]" />
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search waste records"
            aria-label="Search waste records"
            className="w-full bg-transparent text-xs outline-none placeholder:text-[#879188]"
          />
        </form>
        <button
          type="button"
          onClick={onOpenScanner}
          aria-label="Scan food waste"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#315a3a] px-2.5 text-xs font-medium text-white hover:bg-[#274a30] sm:px-3"
        >
          <Camera className="h-4 w-4" /><span className="hidden sm:inline">Scan waste</span>
        </button>
        <button
          type="button"
          onClick={onToggleDemoMode}
          aria-label={demoMode ? 'Disable demo data' : 'Enable demo data'}
          title={demoMode ? 'Demo data is included. Select to disable.' : 'Only verified data is shown. Select to include demo data.'}
          className={`hidden h-8 items-center rounded-md border px-2.5 text-[11px] font-medium sm:inline-flex ${demoMode ? 'border-[#ead9b4] bg-[#fffaf0] text-[#765124]' : 'border-[#dfe4df] bg-white text-[#59645c]'}`}
        >
          {demoMode ? 'DEMO DATA INCLUDED' : 'VERIFIED DATA'}
        </button>
        <button
          type="button"
          onClick={onOpenAuth}
          aria-label={`Profile: ${currentUser?.name || 'user'}, ${currentRole}`}
          className="flex h-9 items-center gap-2 rounded-md px-2 text-left hover:bg-[#f3f5f2]"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eaf0ea] text-xs font-semibold text-[#315a3a]">
            {currentUser?.name?.charAt(0).toUpperCase() || '?'}
          </span>
          <span className="hidden max-w-32 sm:block">
            <span className="block truncate text-xs font-medium">{currentUser?.name || 'Account'}</span>
            <span className="block truncate text-[10px] text-[#68736a]">{currentRole}</span>
          </span>
        </button>
      </div>
    </header>
  );
};
