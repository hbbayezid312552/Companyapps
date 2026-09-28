import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Eye,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Lock,
  Package,
  Printer,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ActiveScreen,
  CompanySettings,
  Dealer,
  FeatureLocks,
  Invoice,
  Language,
  Product,
} from '../types';
import { formatCurrency, formatDateDMY } from '../utils/formatters';
import { translations } from '../utils/translations';

interface Props {
  invoices: Invoice[];
  products: Product[];
  dealers: Dealer[];
  company: CompanySettings;
  featureLocks: FeatureLocks;
  language: Language;
  onNavigate: (screen: ActiveScreen) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export const DashboardScreen: React.FC<Props> = ({
  invoices,
  products,
  dealers,
  company,
  featureLocks,
  language,
  onNavigate,
  onViewInvoice,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  // Calculate statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  const todayInvoices = invoices.filter((inv) => inv.date === todayStr);
  const thisMonthInvoices = invoices.filter((inv) =>
    inv.date.startsWith(currentMonthPrefix)
  );

  const totalSales = invoices.reduce((sum, inv) => sum + (inv.netPayable || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);

  const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.netPayable || 0), 0);
  const monthSales = thisMonthInvoices.reduce((sum, inv) => sum + (inv.netPayable || 0), 0);

  // Recent 5 invoices
  const recentInvoices = invoices.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{company.name}</span>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight">
              {isBangla ? 'স্বাগতম, অ্যাডমিন ড্যাশবোর্ড' : 'Welcome, Admin Dashboard'}
            </h1>
            <p className="text-xs md:text-sm text-blue-200/90 max-w-xl">
              {isBangla
                ? 'ডিলারদের বাণিজ্যিক ইনভয়েস তৈরি, স্বয়ংক্রিয় পার্সেন্টেজ হিসাব, প্রিন্ট ও সম্পূর্ণ অফলাইন ম্যানেজমেন্ট।'
                : 'Commercial invoice generation, automatic percentage calculations, print, PDF & 100% offline database.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('new-invoice')}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600 transition active:scale-95"
            >
              <FilePlus className="h-4 w-4" />
              <span>{t.createInvoiceBtn}</span>
            </button>
          </div>
        </div>

        {/* Ambient Decorative Shapes */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {/* Card 1: Total Sales */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.totalSales}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg md:text-2xl font-black text-slate-900 truncate">
            {formatCurrency(totalSales, company.currencySymbol)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>মাসে:</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(monthSales, company.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Card 2: Due Balance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.totalReceivable}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg md:text-2xl font-black text-red-600 truncate">
            {formatCurrency(totalDue, company.currencySymbol)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
            <span>আদায়:</span>
            <span className="font-semibold">
              {formatCurrency(totalPaid, company.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Card 3: Invoices Count */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.totalInvoices}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg md:text-2xl font-black text-slate-900">
            {invoices.length} <span className="text-xs font-normal text-slate-400">টি</span>
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span>আজকের: <strong className="text-slate-800">{todayInvoices.length}</strong></span>
            <span>•</span>
            <span>চলতি মাস: <strong className="text-slate-800">{thisMonthInvoices.length}</strong></span>
          </div>
        </div>

        {/* Card 4: Dealers & Products */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.totalDealers} ও প্রোডাক্ট
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg md:text-2xl font-black text-slate-900">
            {dealers.length} <span className="text-xs font-normal text-slate-400">ডিলার</span>
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>মোট সক্রিয় প্রোডাক্ট:</span>
            <span className="font-bold text-slate-800">{products.length} টি</span>
          </div>
        </div>
      </div>

      {/* Quick Access Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('new-invoice')}
          className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-left transition hover:bg-blue-100 hover:shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-950">{t.newInvoice}</p>
            <p className="text-[10px] text-blue-700">Excel স্টাইল টেবিল</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('dealers')}
          className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 text-left transition hover:bg-purple-100 hover:shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-950">{t.dealers}</p>
            <p className="text-[10px] text-purple-700">ডিলার ও দোকান তালিকা</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('products')}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left transition hover:bg-slate-100 hover:shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{t.products}</p>
            <p className="text-[10px] text-slate-600">MRP ও % কমিশন</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-left transition hover:bg-amber-100 hover:shadow-xs group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
            {featureLocks.advancedReports ? (
              <Lock className="h-5 w-5" />
            ) : (
              <BarChart3 className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold text-amber-950">{t.reports}</p>
              {featureLocks.advancedReports && (
                <span className="text-[10px] text-amber-600">🔒</span>
              )}
            </div>
            <p className="text-[10px] text-amber-700">বিক্রয় ও বকেয়া হিসাব</p>
          </div>
        </button>
      </div>

      {/* Recent Invoices Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {t.recentInvoices}
            </h2>
            <p className="text-xs text-slate-500">
              {isBangla
                ? 'সর্বশেষ সম্পন্নকৃত ইনভয়েস ও চালানের তালিকা'
                : 'Latest commercial invoices generated'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <span>{t.viewAll}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="py-12 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">কোনো ইনভয়েস পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">
              একটি নতুন ইনভয়েস তৈরি করে শুরু করুন।
            </p>
            <button
              onClick={() => onNavigate('new-invoice')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <FilePlus className="w-4 h-4" />
              {t.createInvoiceBtn}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-3 px-3">ইনভয়েস নং</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-3">ডিলারের নাম</th>
                  <th className="py-3 px-3 text-right">আইটেম</th>
                  <th className="py-3 px-3 text-right">নিট প্রদেয়</th>
                  <th className="py-3 px-3 text-right">বকেয়া</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatDateDMY(inv.date)}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{inv.dealerName}</p>
                      {inv.dealerPhone && (
                        <p className="text-[11px] text-slate-400">{inv.dealerPhone}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {inv.totalItems} টি ({inv.totalQuantity})
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(inv.netPayable, company.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span
                        className={
                          inv.dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'
                        }
                      >
                        {formatCurrency(inv.dueAmount, company.currencySymbol)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.paymentStatus === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" /> পরিশোধিত
                          </>
                        ) : inv.paymentStatus === 'partial' ? (
                          <>
                            <Clock className="w-2.5 h-2.5" /> আংশিক
                          </>
                        ) : (
                          'বকেয়া'
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shadow-2xs"
                          title="View / Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
