import React from 'react';
import {
  LayoutDashboard,
  Trash2,
  TrendingUp,
  UtensilsCrossed,
  PackageCheck,
  Truck,
  BarChart2,
  Activity,
  Building2,
  Users,
  Settings,
  HelpCircle,
  Camera
} from 'lucide-react';
import { UserRole } from '../types.ts';

export type NavTab =
  | 'dashboard'
  | 'waste'
  | 'forecast'
  | 'production'
  | 'surplus'
  | 'redistribution'
  | 'analytics'
  | 'operations'
  | 'organizations'
  | 'users'
  | 'settings'
  | 'help'
  | 'receiver'
  | 'scan'
  | 'history';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentRole: UserRole;
  surplusCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  surplusCount
}) => {
  // Primary operational nav items
  const primaryNav = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'waste' as NavTab, label: 'Waste', icon: Trash2 },
    { id: 'forecast' as NavTab, label: 'Forecast', icon: TrendingUp },
    { id: 'production' as NavTab, label: 'Production', icon: UtensilsCrossed },
    { id: 'surplus' as NavTab, label: 'Surplus', icon: PackageCheck, count: surplusCount > 0 ? surplusCount : undefined },
    { id: 'redistribution' as NavTab, label: 'Redistribution', icon: Truck },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart2 }
  ];

  // Secondary administrative / operational nav items
  const secondaryNav = [
    { id: 'operations' as NavTab, label: 'Operations', icon: Activity },
    { id: 'organizations' as NavTab, label: 'Organizations', icon: Building2 },
    { id: 'users' as NavTab, label: 'Users', icon: Users }
  ];

  // If user is a receiver NGO, add quick link
  if (currentRole === 'Receiver') {
    primaryNav.push({
      id: 'receiver' as NavTab,
      label: 'NGO Portal',
      icon: Building2
    });
  }

  return (
    <>
      {/* Desktop Left Sidebar: 220–240px */}
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 bg-white/60 backdrop-blur-xl border-r border-[#dfe8e0] min-h-[calc(100vh-64px)] select-none">
        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Primary Operations Section */}
          <div className="space-y-0.5">
            {primaryNav.map(item => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'waste' && (activeTab === 'history' || activeTab === 'scan'));

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] transition-colors ${
                    isActive
                      ? 'bg-[#e5f2e9] text-[#174b36] font-semibold shadow-sm'
                      : 'text-[#66736b] hover:bg-[#edf5ef] hover:text-[#15231b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#171717]' : 'text-[#777777]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#E5E5E2] text-[#444444]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="pt-2 border-t border-[#E5E5E2]">
            <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#888888]">
              Management
            </p>
            <div className="space-y-0.5">
              {secondaryNav.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] transition-colors ${
                      isActive
                        ? 'bg-[#e5f2e9] text-[#174b36] font-semibold shadow-sm'
                        : 'text-[#66736b] hover:bg-[#edf5ef] hover:text-[#15231b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#171717]' : 'text-[#777777]'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: Settings & Help */}
        <div className="p-3 border-t border-[#E5E5E2] space-y-0.5 bg-[#F7F7F5]">
          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#EAEAE7] text-[#171717] font-medium'
                : 'text-[#666666] hover:bg-[#F0F0ED] hover:text-[#171717]'
            }`}
          >
            <Settings className="w-4 h-4 text-[#777777]" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => onSelectTab('help')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-[13px] transition-colors ${
              activeTab === 'help'
                ? 'bg-[#EAEAE7] text-[#171717] font-medium'
                : 'text-[#666666] hover:bg-[#F0F0ED] hover:text-[#171717]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[#777777]" />
            <span>Help</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar: 5 core tabs */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#dfe8e0] px-2 py-2 flex items-center justify-around shadow-[0_-8px_24px_rgba(31,92,69,0.08)]">
        {[
          { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
          { id: 'waste' as NavTab, label: 'Waste', icon: Trash2 },
          { id: 'forecast' as NavTab, label: 'Forecast', icon: TrendingUp },
          { id: 'surplus' as NavTab, label: 'Surplus', icon: PackageCheck },
          { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart2 }
        ].map(item => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'waste' && (activeTab === 'history' || activeTab === 'scan'));
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#1E3A2B] font-semibold' : 'text-[#777777]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#1E3A2B]' : 'text-[#777777]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
