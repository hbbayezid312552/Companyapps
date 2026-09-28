import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Download,
  FileSpreadsheet,
  Lock,
  Package,
  Printer,
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
import { printInvoiceDirect } from '../services/pdf';

interface Props {
  invoices: Invoice[];
  dealers: Dealer[];
  products: Product[];
  company: CompanySettings;
  featureLocks: FeatureLocks;
  language: Language;
  onNavigateSettings: () => void;
}

export const ReportsScreen: React.FC<Props> = ({
  invoices,
  dealers,
  products,
  company,
  featureLocks,
  language,
  onNavigateSettings,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  // Date range filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'dealers' | 'products'>('summary');

  // If feature is locked by admin
  if (featureLocks.advancedReports) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8 md:p-12 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{t.featureLockedTitle}</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          {t.featureLockedDesc}
        </p>
        <button
          onClick={onNavigateSettings}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition"
        >
          <span>{t.unlockInSettings}</span>
        </button>
      </div>
    );
  }

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (fromDate && inv.date < fromDate) return false;
      if (toDate && inv.date > toDate) return false;
      return true;
    });
  }, [invoices, fromDate, toDate]);

  // Overall financial sums
  const totalGross = filteredInvoices.reduce((s, inv) => s + (inv.grossAmount || 0), 0);
  const totalDiscount = filteredInvoices.reduce((s, inv) => s + (inv.totalDiscount || 0), 0);
  const totalNet = filteredInvoices.reduce((s, inv) => s + (inv.netPayable || 0), 0);
  const totalPaid = filteredInvoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0);
  const totalDue = filteredInvoices.reduce((s, inv) => s + (inv.dueAmount || 0), 0);

  // Dealer-wise calculations
  const dealerStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; invoiced: number; paid: number; due: number }
    >();

    filteredInvoices.forEach((inv) => {
      const dName = inv.dealerName || 'Unknown Dealer';
      const existing = map.get(dName) || {
        name: dName,
        count: 0,
        invoiced: 0,
        paid: 0,
        due: 0,
      };
      existing.count += 1;
      existing.invoiced += inv.netPayable || 0;
      existing.paid += inv.paidAmount || 0;
      existing.due += inv.dueAmount || 0;
      map.set(dName, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.invoiced - a.invoiced);
  }, [filteredInvoices]);

  // Product-wise calculations
  const productStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; qty: number; totalSales: number }
    >();

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const pName = item.productName || 'General Product';
        const existing = map.get(pName) || {
          name: pName,
          qty: 0,
          totalSales: 0,
        };
        existing.qty += item.quantity || 0;
        existing.totalSales += item.total || 0;
        map.set(pName, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-xs border border-slate-200 no-print">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            {t.reports}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isBangla
              ? 'দৈনিক, মাসিক, ডিলার-ওয়ারী ও প্রোডাক্ট-ওয়ারী বিক্রয় ও বকেয়া হিসাব'
              : 'Sales, collection, dealer ledger, and product-wise volume report'}
          </p>
        </div>

        <button
          onClick={printInvoiceDirect}
          className="flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-slate-900 transition"
        >
          <Printer className="w-4 h-4" />
          <span>{isBangla ? 'রিপোর্ট প্রিন্ট করুন' : 'Print Report'}</span>
        </button>
      </div>

      {/* Date Filter & Tabs (Hidden in Print) */}
      <div className="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">তারিখ রেঞ্জ ফিল্টার:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-300 p-2 text-xs text-slate-900"
            />
            <span className="text-xs text-slate-500">হতে</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-300 p-2 text-xs text-slate-900"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs font-bold text-red-600 hover:underline ml-2"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 rounded-xl py-2 transition ${
              activeTab === 'summary'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সারসংক্ষেপ (Overview)
          </button>
          <button
            onClick={() => setActiveTab('dealers')}
            className={`flex-1 rounded-xl py-2 transition ${
              activeTab === 'dealers'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ডিলার-ওয়ারী হিসাব (Dealer Ledger)
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 rounded-xl py-2 transition ${
              activeTab === 'products'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            প্রোডাক্ট-ওয়ারী বিক্রয় (Product Volume)
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="print-only text-center pb-4 border-b border-slate-300">
        <h2 className="text-xl font-black text-slate-900">{company.name}</h2>
        <p className="text-xs text-slate-600">{company.address} | Phone: {company.phone}</p>
        <h3 className="text-base font-bold text-blue-900 mt-2">
          বাণিজ্যিক বিক্রয় ও বকেয়া রিপোর্ট (SALES REPORT)
        </h3>
        <p className="text-xs text-slate-500">
          রিপোর্টের সময়কাল:{' '}
          {fromDate ? formatDateDMY(fromDate) : 'শুরু থেকে'}{' '}
          হতে{' '}
          {toDate ? formatDateDMY(toDate) : 'বর্তমান পর্যন্ত'}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500">মোট বিক্রয় (নিট)</p>
          <p className="text-lg md:text-xl font-black text-blue-700 mt-1">
            {formatCurrency(totalNet, company.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            গ্রস: {formatCurrency(totalGross, company.currencySymbol)}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500">মোট ছাড় / কমিশন</p>
          <p className="text-lg md:text-xl font-black text-amber-600 mt-1">
            {formatCurrency(totalDiscount, company.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">ডিলারদের সুবিধা</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500">মোট ক্যাশ / আদায়</p>
          <p className="text-lg md:text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalPaid, company.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">ব্যাংক ও নগদ</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500">মোট বকেয়া পাওনা</p>
          <p className="text-lg md:text-xl font-black text-red-600 mt-1">
            {formatCurrency(totalDue, company.currencySymbol)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">ডিলারদের কাছে অবশিষ্ট</p>
        </div>
      </div>

      {/* Tab 1: Overview Summary Table */}
      {activeTab === 'summary' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            ইনভয়েস ভিত্তিক হিসাব তালিকা ({filteredInvoices.length} টি)
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">ইনভয়েস নং</th>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3">ডিলার</th>
                  <th className="py-2.5 px-3 text-right">গ্রস প্রাইজ</th>
                  <th className="py-2.5 px-3 text-right">কমিশন</th>
                  <th className="py-2.5 px-3 text-right">নিট প্রদেয়</th>
                  <th className="py-2.5 px-3 text-right">আদায়</th>
                  <th className="py-2.5 px-3 text-right">বকেয়া</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatDateDMY(inv.date)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {inv.dealerName}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {formatCurrency(inv.grossAmount, company.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-500">
                      {formatCurrency(inv.totalDiscount, company.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(inv.netPayable, company.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                      {formatCurrency(inv.paidAmount, company.currencySymbol)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black">
                      <span className={inv.dueAmount > 0 ? 'text-red-600' : 'text-slate-400'}>
                        {formatCurrency(inv.dueAmount, company.currencySymbol)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Dealer-wise Breakdown */}
      {activeTab === 'dealers' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            ডিলার-ওয়ারী বিক্রয় ও বকেয়া খতিয়ান
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-purple-50 text-purple-900 font-bold border-b border-purple-100">
                  <th className="py-3 px-3">ডিলারের নাম</th>
                  <th className="py-3 px-3 text-center">চালান সংখ্যা</th>
                  <th className="py-3 px-3 text-right">মোট বিক্রয় (নিট)</th>
                  <th className="py-3 px-3 text-right">মোট পরিশোধ</th>
                  <th className="py-3 px-3 text-right">বকেয়া ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dealerStats.map((ds) => (
                  <tr key={ds.name} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {ds.name}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {ds.count} টি
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatCurrency(ds.invoiced, company.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                      {formatCurrency(ds.paid, company.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-right font-black">
                      <span className={ds.due > 0 ? 'text-red-600' : 'text-slate-400'}>
                        {formatCurrency(ds.due, company.currencySymbol)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Product-wise Volume */}
      {activeTab === 'products' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            প্রোডাক্ট-ওয়ারী বিক্রয় ও পরিমাণ হিসাব
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50 text-blue-900 font-bold border-b border-blue-100">
                  <th className="py-3 px-3">প্রোডাক্টের নাম</th>
                  <th className="py-3 px-3 text-center">মোট বিক্রিত পরিমাণ</th>
                  <th className="py-3 px-3 text-right">মোট বিক্রয় মূল্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productStats.map((ps) => (
                  <tr key={ps.name} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {ps.name}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {ps.qty} একক
                    </td>
                    <td className="py-3 px-3 text-right font-black text-blue-700">
                      {formatCurrency(ps.totalSales, company.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
