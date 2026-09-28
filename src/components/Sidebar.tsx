import React from 'react';
import {
  BarChart3,
  Building2,
  Database,
  FilePlus,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Lock,
  Package,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { ActiveScreen, FeatureLocks, Language } from '../types';
import { translations } from '../utils/translations';

interface Props {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  featureLocks: FeatureLocks;
  invoiceCount?: number;
  productCount?: number;
  dealerCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeScreen,
  onNavigate,
  isOpen,
  onClose,
  language,
  featureLocks,
  invoiceCount = 0,
  productCount = 0,
  dealerCount = 0,
}) => {
  const t = translations[language];

  const handleNav = (screen: ActiveScreen) => {
    onNavigate(screen);
    onClose();
  };

  const menuItems = [
    {
      id: 'dashboard' as ActiveScreen,
      label: t.dashboard,
      icon: LayoutDashboard,
      badge: null,
      locked: false,
    },
    {
      id: 'new-invoice' as ActiveScreen,
      label: t.newInvoice,
      icon: FilePlus,
      badge: 'New',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      locked: false,
    },
    {
      id: 'invoices' as ActiveScreen,
      label: t.invoiceList,
      icon: FileText,
      badge: invoiceCount > 0 ? invoiceCount : null,
      badgeColor: 'bg-blue-100 text-blue-700',
      locked: false,
    },
    {
      id: 'dealers' as ActiveScreen,
      label: t.dealers,
      icon: Users,
      badge: dealerCount > 0 ? dealerCount : null,
      badgeColor: 'bg-purple-100 text-purple-700',
      locked: false,
    },
    {
      id: 'products' as ActiveScreen,
      label: t.products,
      icon: Package,
      badge: productCount > 0 ? productCount : null,
      badgeColor: 'bg-slate-100 text-slate-700',
      locked: false,
    },
    {
      id: 'reports' as ActiveScreen,
      label: t.reports,
      icon: BarChart3,
      badge: featureLocks.advancedReports ? '🔒' : null,
      badgeColor: 'bg-amber-100 text-amber-700',
      locked: featureLocks.advancedReports,
    },
    {
      id: 'settings' as ActiveScreen,
      label: t.settings,
      icon: Settings,
      badge: null,
      locked: false,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 md:w-60 lg:w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col no-print`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm">
              {language === 'bn' ? 'মেনু বার' : 'Navigation Menu'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {language === 'bn' ? 'প্রধান মেনু' : 'Main Menu'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.locked && (
                    <span title="Feature Locked">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    </span>
                  )}
                  {item.badge && !item.locked && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Quick Shortcuts Section */}
          <div className="pt-4 px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {language === 'bn' ? 'সরাসরি সেটিংস' : 'Shortcuts'}
          </div>

          <button
            onClick={() => handleNav('settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{t.companySettings}</span>
          </button>

          <button
            onClick={() => handleNav('settings')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>{t.backupRestore}</span>
          </button>
        </nav>

        {/* Footer info in sidebar */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/70">
          <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
            <p className="text-xs font-bold text-slate-800">
              Smart Invoice Manager
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              100% Free & Offline-Ready
            </p>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.offlineStatus}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
