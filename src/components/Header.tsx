import React, { useState } from 'react';
import {
  Search,
  Bell,
  Building2,
  User,
  ChevronDown,
  Check,
  ExternalLink,
  ShieldCheck,
  Database
} from 'lucide-react';
import { DatabaseTelemetry, UserRole } from '../types.ts';
import { AuthUser } from './AuthModal.tsx';
import { NavTab } from './Navigation.tsx';

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
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentRole,
  currentUser,
  onOpenAuth,
  databaseTelemetry,
  geminiConfigured,
  demoMode,
  onToggleDemoMode,
  onOpenSettings
}) => {
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState('Main Campus Kitchen');

  // Derive human-readable page title
  const getPageTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'waste':
      case 'history':
      case 'scan':
        return 'Waste';
      case 'forecast':
        return 'Demand Forecast';
      case 'production':
        return 'Production';
      case 'surplus':
        return 'Surplus';
      case 'redistribution':
        return 'Redistribution';
      case 'analytics':
        return 'Analytics';
      case 'operations':
        return 'Operations';
      case 'organizations':
        return 'Organizations';
      case 'users':
        return 'Users';
      case 'settings':
        return 'Settings';
      case 'help':
        return 'Documentation';
      case 'receiver':
        return 'Receiver Portal';
      default:
        return 'Overview';
    }
  };

  const kitchenOptions = [
    'Main Campus Kitchen',
    'North Dining Hall #2',
    'Executive Banquet Unit'
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-xl border-b border-[#dfe8e0] px-4 lg:px-6 flex items-center justify-between shadow-[0_4px_20px_rgba(31,92,69,0.04)]">
      {/* Left: Brand + Divider + Page Title */}
      <div className="flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1f5c45] to-[#52b788] inline-flex items-center justify-center text-white text-xs font-bold shadow-sm">FW</span>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#15231b] block leading-none">FoodWise</span>
            <span className="text-[10px] text-[#718078] tracking-[0.12em] uppercase">Kitchen intelligence</span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#E5E5E2]" />

        {/* Page Title */}
        <h1 className="text-sm font-semibold text-[#15231b]">
          {getPageTitle(activeTab)}
        </h1>
      </div>

      {/* Right: Search + Demo Tag + Org Selector + Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#E5E5E2] text-xs text-[#777777] w-48 hover:border-[#CCCCCC] transition-colors">
          <Search className="w-3.5 h-3.5 text-[#999999]" />
          <input
            type="text"
            placeholder="Search records, items..."
            className="w-full bg-transparent border-none outline-none text-xs text-[#171717] placeholder-[#999999]"
          />
          <kbd className="text-[10px] font-mono text-[#888888] bg-[#F0F0EE] px-1 py-0.2 rounded border border-[#E5E5E2]">
            /
          </kbd>
        </div>

        {/* Demo / Verified Data Toggle */}
        <button
          onClick={onToggleDemoMode}
          title="Toggle Demo baseline records vs Verified user entries"
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            demoMode
              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:bg-[#FEF3C7]'
              : 'bg-white text-[#1E3A2B] border-[#C2E0CC] hover:bg-[#F2F8F4]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-[#D97706]' : 'bg-[#1E3A2B]'}`}></span>
          <span className="font-mono text-[11px] font-medium">{demoMode ? 'DEMO' : 'VERIFIED'}</span>
        </button>

        {/* Kitchen Organization Selector */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-white border border-[#E5E5E2] text-[#171717] hover:bg-[#FAFAFA] transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-[#666666]" />
            <span className="font-medium max-w-[140px] truncate">{selectedKitchen}</span>
            <ChevronDown className="w-3 h-3 text-[#888888]" />
          </button>

          {showOrgDropdown && (
            <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E5E5E2] rounded-md shadow-sm py-1 z-50 text-xs">
              <div className="px-3 py-1 text-[11px] font-medium text-[#888888] uppercase tracking-wider">
                Select Kitchen
              </div>
              {kitchenOptions.map(k => (
                <button
                  key={k}
                  onClick={() => {
                    setSelectedKitchen(k);
                    setShowOrgDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-[#171717] hover:bg-[#F7F7F5] flex items-center justify-between"
                >
                  <span>{k}</span>
                  {selectedKitchen === k && <Check className="w-3.5 h-3.5 text-[#1E3A2B]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded hover:bg-[#EAEAE7] text-left transition-colors border border-transparent hover:border-[#E5E5E2]"
        >
          <div className="w-6 h-6 rounded bg-[#1E3A2B] text-white flex items-center justify-center text-xs font-medium">
            {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-[#171717] leading-none">
              {currentUser?.name || 'Arjun Rao'}
            </p>
            <p className="text-[11px] text-[#666666] leading-tight">
              {currentRole}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
