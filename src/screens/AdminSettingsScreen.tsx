import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Database,
  Download,
  KeyRound,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Unlock,
  Upload,
} from 'lucide-react';
import { CompanySettings, FeatureLocks, Language } from '../types';
import { translations } from '../utils/translations';
import { exportBackupJSON, resetToDemoData, restoreBackupJSON } from '../services/backup';
import { updateAdminCredentials } from '../services/auth';
import { ConfirmModal } from '../components/ConfirmModal';

interface Props {
  company: CompanySettings;
  featureLocks: FeatureLocks;
  language: Language;
  onUpdateCompany: (company: CompanySettings) => void;
  onUpdateFeatureLocks: (locks: FeatureLocks) => void;
}

export const AdminSettingsScreen: React.FC<Props> = ({
  company: initialCompany,
  featureLocks: initialLocks,
  language,
  onUpdateCompany,
  onUpdateFeatureLocks,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  const [activeTab, setActiveTab] = useState<'company' | 'security' | 'locks' | 'backup'>('company');

  // Company Form State
  const [companyForm, setCompanyForm] = useState<CompanySettings>(initialCompany);
  const [companySavedToast, setCompanySavedToast] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Feature Locks State
  const [locks, setLocks] = useState<FeatureLocks>(initialLocks);

  // Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(isBangla ? 'লোগো ফাইল ২MB এর কম হতে হবে।' : 'Logo size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompanyForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save company settings
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(companyForm);
    setCompanySavedToast(true);
    setTimeout(() => setCompanySavedToast(false), 2500);
  };

  // Update Admin Password / Email
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setAuthMsg({
        text: isBangla ? 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ মেলেনি!' : 'New passwords do not match!',
        isError: true,
      });
      return;
    }

    const res = await updateAdminCredentials(newEmail, newPassword, undefined, currentPassword);
    setAuthMsg({ text: res.message, isError: !res.success });
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // Toggle Feature Lock
  const handleToggleLock = (key: keyof FeatureLocks) => {
    const updated = {
      ...locks,
      [key]: !locks[key],
    };
    setLocks(updated);
    onUpdateFeatureLocks(updated);
  };

  // Backup Download
  const handleExportBackup = () => {
    exportBackupJSON();
  };

  // Restore file change
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = restoreBackupJSON(reader.result);
        setRestoreFeedback({ text: res.message, isError: !res.success });
        if (res.success) {
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            {t.settings}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isBangla
              ? 'কোম্পানি প্রোফাইল, লোগো, নিরাপত্তা, ব্যাকআপ ও প্রিমিয়াম ফিচার লক'
              : 'Company profile, logo, credentials, data backup & feature locks'}
          </p>
        </div>

        {/* Tab Selection Pill */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition ${
              activeTab === 'company'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>কোম্পানি তথ্য</span>
          </button>

          <button
            onClick={() => setActiveTab('locks')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition ${
              activeTab === 'locks'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>ফিচার লক (🔒)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition ${
              activeTab === 'security'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>নিরাপত্তা</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 transition ${
              activeTab === 'backup'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ব্যাকআপ</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Company Information Form */}
      {activeTab === 'company' && (
        <form
          onSubmit={handleSaveCompany}
          className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                কোম্পানির বিবরণ ও ইনভয়েস হেডার
              </h2>
              <p className="text-[11px] text-slate-500">
                এই তথ্য ইনভয়েস, প্রিন্ট কপি এবং PDF ফাইলের উপরে প্রদর্শিত হবে
              </p>
            </div>

            {companySavedToast && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                সংরক্ষণ হয়েছে!
              </span>
            )}
          </div>

          {/* Logo Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-300 p-2 overflow-hidden shadow-2xs">
              {companyForm.logoUrl ? (
                <img
                  src={companyForm.logoUrl}
                  alt="Company Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-center text-[10px] font-bold text-slate-400">
                  লোগো নেই
                </span>
              )}
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left text-xs">
              <p className="font-bold text-slate-800">কোম্পানি লোগো (Invoice & PDF Logo)</p>
              <p className="text-slate-500 text-[11px]">
                PNG বা JPEG ফরম্যাট আপলোড করুন (সর্বোচ্চ 2MB)। এটি ইনভয়েস এবং প্রিন্ট পেজে স্পষ্ট দেখাবে।
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs">
                  লোগো ছবি নির্বাচন করুন
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {companyForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setCompanyForm({ ...companyForm, logoUrl: '' })}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    লোগো সরান
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                কোম্পানির নাম (English) *
              </label>
              <input
                type="text"
                required
                value={companyForm.name}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                কোম্পানির নাম (বাংলা)
              </label>
              <input
                type="text"
                value={companyForm.banglaName}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, banglaName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ট্যাগলাইন / স্লোগান
              </label>
              <input
                type="text"
                value={companyForm.tagline}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, tagline: e.target.value })
                }
                placeholder="যেমন: গুণগত মান ও আস্থার প্রতীক"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                হেড অফিস ঠিকানা *
              </label>
              <input
                type="text"
                required
                value={companyForm.address}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, address: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ফোন / হটলাইন নম্বর *
              </label>
              <input
                type="text"
                required
                value={companyForm.phone}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, phone: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ইমেইল ঠিকানা
              </label>
              <input
                type="email"
                value={companyForm.email}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, email: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                কোম্পানি চেয়ারম্যান / অনুমোদিত ব্যক্তির নাম *
              </label>
              <input
                type="text"
                required
                value={companyForm.chairmanName}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, chairmanName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                স্বাক্ষরের পদবি (Signature Box Title)
              </label>
              <input
                type="text"
                value={companyForm.chairmanTitle}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, chairmanTitle: e.target.value })
                }
                placeholder="কোম্পানি চেয়ারম্যান / অনুমোদিত স্বাক্ষর"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                কারেন্সি সিম্বল
              </label>
              <input
                type="text"
                value={companyForm.currencySymbol}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, currencySymbol: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ইনভয়েস প্রিফিক্স
              </label>
              <input
                type="text"
                value={companyForm.invoicePrefix}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })
                }
                placeholder="INV"
                className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">
              ইনভয়েস শর্তাবলী (Terms & Conditions)
            </label>
            <textarea
              rows={3}
              value={companyForm.termsAndConditions}
              onChange={(e) =>
                setCompanyForm({
                  ...companyForm,
                  termsAndConditions: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              <span>কোম্পানি সেটিংস সংরক্ষণ</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Feature Locks Management (Requirement 21) */}
      {activeTab === 'locks' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              ফিচার লক ও আনলক সিস্টেম (Feature Lock Management)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              অ্যাডমিন হিসেবে আপনি নির্দিষ্ট মডিউলগুলো লক 🔒 বা আনলক 🔓 করতে পারেন। লক করা থাকলে ব্যবহারকারী 🔒 দেখতে পাবে।
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Feature 1: Advanced Reports */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    অ্যাডভান্সড সেলস রিপোর্ট ও খতিয়ান (Advanced Reports)
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      locks.advancedReports
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {locks.advancedReports ? '🔒 Locked' : '🔓 Unlocked'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  তারিখ রেঞ্জ ফিল্টার, ডিলার-ওয়ারী সেলস খতিয়ান ও প্রোডাক্ট ভলিউম রিপোর্ট।
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLock('advancedReports')}
                className="text-slate-600 hover:text-blue-600 transition"
                title="Toggle lock status"
              >
                {locks.advancedReports ? (
                  <ToggleLeft className="w-8 h-8 text-amber-500" />
                ) : (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                )}
              </button>
            </div>

            {/* Feature 2: Cloud Sync */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    ক্লাউড ব্যাকআপ ও অনলাইন সিংক (Cloud Sync)
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      locks.cloudSync
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {locks.cloudSync ? '🔒 Locked' : '🔓 Unlocked'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  ভবিষ্যতের ক্লাউড ডেটাবেজ সিংক মডিউল।
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLock('cloudSync')}
                className="text-slate-600 hover:text-blue-600 transition"
              >
                {locks.cloudSync ? (
                  <ToggleLeft className="w-8 h-8 text-amber-500" />
                ) : (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                )}
              </button>
            </div>

            {/* Feature 3: Multi-user staff roles */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    মাল্টি-ইউজার স্টাফ পারমিশন (Multi-User Staff Roles)
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      locks.multiUserStaff
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {locks.multiUserStaff ? '🔒 Locked' : '🔓 Unlocked'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  একাধিক সেলস রিপ্রেজেন্টেটিভ বা ম্যানেজারের জন্য পৃথক লগইন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLock('multiUserStaff')}
                className="text-slate-600 hover:text-blue-600 transition"
              >
                {locks.multiUserStaff ? (
                  <ToggleLeft className="w-8 h-8 text-amber-500" />
                ) : (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                )}
              </button>
            </div>

            {/* Feature 4: Profit Margin Analytics */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    মুনাফা ও প্রফিট মার্জিন অ্যানালিটিক্স (Profit Margin Analytics)
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      locks.profitMarginAnalytics
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {locks.profitMarginAnalytics ? '🔒 Locked' : '🔓 Unlocked'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  প্রতিটি চালানে নিট লাভ ও মার্জিন হিসাব।
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLock('profitMarginAnalytics')}
                className="text-slate-600 hover:text-blue-600 transition"
              >
                {locks.profitMarginAnalytics ? (
                  <ToggleLeft className="w-8 h-8 text-amber-500" />
                ) : (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Password Management */}
      {activeTab === 'security' && (
        <form
          onSubmit={handleUpdatePassword}
          className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 shadow-xs space-y-5 max-w-xl"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              অ্যাডমিন ক্রেডেনশিয়াল ও পাসওয়ার্ড পরিবর্তন
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Web Crypto SHA-256 দিয়ে নিরাপদভাবে পাসওয়ার্ড এনক্রিপ্ট হবে
            </p>
          </div>

          {authMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                authMsg.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {authMsg.isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{authMsg.text}</span>
            </div>
          )}

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                বর্তমান পাসওয়ার্ড (যাচাইয়ের জন্য) *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                নতুন অ্যাডমিন ইমেইল (ঐচ্ছিক)
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="নতুন ইমেইল দিন (যদি পরিবর্তন করতে চান)"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                নতুন পাসওয়ার্ড *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                নতুন পাসওয়ার্ড পুনরায় নিশ্চিত করুন *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>পাসওয়ার্ড আপডেট করুন</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              সম্পূর্ণ ডেটাবেজ ব্যাকআপ ও রিস্টোর (Offline Data Backup)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              সকল ইনভয়েস, ডিলার, প্রোডাক্ট ও সেটিংস এক ক্লিকে JSON ফাইলে ব্যাকআপ বা রিস্টোর করুন
            </p>
          </div>

          {restoreFeedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                restoreFeedback.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {restoreFeedback.isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{restoreFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Download className="w-4 h-4 text-blue-600" />
                <span>ব্যাকআপ ডাউনলোড (Export)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার ডিভাইসে একটি সম্পূর্ণ ব্যাকআপ JSON ফাইল ডাউনলোড করুন। এটি নিরাপদ স্থানে সংরক্ষণ করে রাখা যাবে।
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" />
                <span>JSON ব্যাকআপ ডাউনলোড করুন</span>
              </button>
            </div>

            {/* Restore Card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>ব্যাকআপ রিস্টোর (Import)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                পূর্বে সংরক্ষিত `.json` ফাইল আপলোড করে সমস্ত ডেটা মুহূর্তের মধ্যে পুনরুদ্ধার করুন।
              </p>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>ব্যাকআপ ফাইল আপলোড করুন</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reset / Demo Data Section */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">
                ডেমো ডেটা রিসেট বা প্রাথমিক অবস্থায় ফিরে যাওয়া
              </p>
              <p className="text-[11px] text-slate-500">
                পরীক্ষা করার সুবিধার্থে প্রাথমিক ডেমো প্রোডাক্ট, ডিলার ও ইনভয়েস পুনরায় লোড করতে পারবেন।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ডেমো ডেটা রিলোড করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="ডেমো ডেটা রিলোড করবেন?"
        message="এটি বর্তমান ডেটা রিসেট করে প্রাথমিক ডেমো ইনভয়েস, ডিলার ও প্রোডাক্ট লোড করবে। আপনি কি এগিয়ে যেতে চান?"
        confirmLabel="হ্যাঁ, ডেমো ডেটা লোড করুন"
        cancelLabel="বাতিল"
        isDanger={false}
        onConfirm={resetToDemoData}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
