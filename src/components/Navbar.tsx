import React from 'react';
import {
  FileSpreadsheet,
  Globe,
  LogOut,
  Menu,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AuthSession } from '../types/auth';
import { CompanySettings, Language } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { formatDateDMY } from '../utils/formatters';

interface Props {
  company: CompanySettings;
  session: AuthSession | null;
  language: Language;
  onLanguageToggle: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<Props> = ({
  company,
  session,
  language,
  onLanguageToggle,
  onLogout,
  onToggleSidebar,
}) => {
  const isBangla = language === 'bn';
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur-md no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition md:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm md:text-base font-black text-slate-900 leading-tight">
                {isBangla ? 'স্মার্ট ইনভয়েস' : 'Smart Invoice'}
              </h1>
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[140px] md:max-w-[240px]">
              {company.banglaName || company.name}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <span>{formatDateDMY(todayStr)}</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton isBangla={isBangla} />

        {/* Language Switcher */}
        <button
          onClick={onLanguageToggle}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>{isBangla ? 'EN' : 'বাংলা'}</span>
        </button>

        {/* Admin Profile / Logout */}
        {session ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Admin</span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50/80 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
              title={isBangla ? 'লগআউট' : 'Logout'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBangla ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    </header>
  );
};
