import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FilePlus,
  FileText,
  Filter,
  Printer,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import { CompanySettings, Invoice, Language } from '../types';
import { formatCurrency, formatDateDMY } from '../utils/formatters';
import { translations } from '../utils/translations';
import { exportInvoicePDF } from '../services/pdf';
import { ConfirmModal } from '../components/ConfirmModal';

interface Props {
  invoices: Invoice[];
  company: CompanySettings;
  language: Language;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onNavigateNewInvoice: () => void;
}

export const InvoiceListScreen: React.FC<Props> = ({
  invoices,
  company,
  language,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onNavigateNewInvoice,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'due'>('all');
  const [selectedDealerFilter, setSelectedDealerFilter] = useState('all');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Distinct dealers list for filter dropdown
  const distinctDealers = useMemo(() => {
    const map = new Map<string, string>();
    invoices.forEach((inv) => {
      if (inv.dealerName) {
        map.set(inv.dealerName, inv.dealerName);
      }
    });
    return Array.from(map.values());
  }, [invoices]);

  // Filtering logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Text Search: Invoice No, Dealer Name, Dealer Phone
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNo = inv.invoiceNo.toLowerCase().includes(query);
        const matchDealer = inv.dealerName.toLowerCase().includes(query);
        const matchPhone = (inv.dealerPhone || '').toLowerCase().includes(query);
        if (!matchNo && !matchDealer && !matchPhone) {
          return false;
        }
      }

      // 2. Specific Dealer filter
      if (selectedDealerFilter !== 'all') {
        if (inv.dealerName !== selectedDealerFilter) {
          return false;
        }
      }

      // 3. Date Range (from - to)
      if (startDate && inv.date < startDate) {
        return false;
      }
      if (endDate && inv.date > endDate) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter === 'paid' && inv.paymentStatus !== 'paid') {
        return false;
      }
      if (statusFilter === 'partial' && inv.paymentStatus !== 'partial') {
        return false;
      }
      if (statusFilter === 'due' && inv.paymentStatus === 'paid') {
        return false;
      }

      return true;
    });
  }, [invoices, searchTerm, selectedDealerFilter, startDate, endDate, statusFilter]);

  // Calculations for filtered list
  const filterTotalAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.netPayable || 0),
    0
  );
  const filterPaidAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.paidAmount || 0),
    0
  );
  const filterDueAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.dueAmount || 0),
    0
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSelectedDealerFilter('all');
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeleteInvoice(deleteId);
      setDeleteId(null);
    }
  };

  const handleQuickPDF = (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    exportInvoicePDF(inv, company);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {t.invoiceList}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isBangla
              ? 'তারিখ, ডিলার ও ইনভয়েস নম্বর দিয়ে নির্ভুল ফিল্টার ও অনুসন্ধান'
              : 'Search and filter invoices by date, date range, dealer, or invoice number'}
          </p>
        </div>

        <button
          onClick={onNavigateNewInvoice}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          <FilePlus className="w-4 h-4" />
          <span>{t.createInvoiceBtn}</span>
        </button>
      </div>

      {/* Deep Search & Filter Box */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>অনুসন্ধান ও ফিল্টার (Search & Date Range Filter)</span>
          </div>
          {(searchTerm || startDate || endDate || statusFilter !== 'all' || selectedDealerFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-800"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ফিল্টার রিসেট</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ইনভয়েস নম্বর / ডিলার / ফোন:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="যেমন: INV-2026-1001 বা রফিক..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              শুরুর তারিখ (From Date):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              শেষ তারিখ (To Date):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              পেমেন্ট স্ট্যাটাস:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'partial' | 'due')}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 px-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">সকল ইনভয়েস</option>
              <option value="paid">শুধুমাত্র পরিশোধিত</option>
              <option value="partial">আংশিক পরিশোধ</option>
              <option value="due">বকেয়া সম্পন্ন</option>
            </select>
          </div>
        </div>

        {/* Dealer Specific Dropdown Filter */}
        {distinctDealers.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">ডিলার নির্বাচন:</span>
            <button
              onClick={() => setSelectedDealerFilter('all')}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedDealerFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              সকল ডিলার ({invoices.length})
            </button>
            {distinctDealers.slice(0, 5).map((dName) => (
              <button
                key={dName}
                onClick={() => setSelectedDealerFilter(dName)}
                className={`rounded-lg px-2.5 py-1 truncate max-w-[200px] transition ${
                  selectedDealerFilter === dName
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {dName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Result Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
          <p className="text-[11px] font-bold text-slate-500">মোট পাওয়া গেছে</p>
          <p className="text-base font-black text-slate-900 mt-0.5">
            {filteredInvoices.length} টি ইনভয়েস
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
          <p className="text-[11px] font-bold text-slate-500">ফিল্টারকৃত মোট বিক্রয়</p>
          <p className="text-base font-black text-blue-700 mt-0.5">
            {formatCurrency(filterTotalAmount, company.currencySymbol)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
          <p className="text-[11px] font-bold text-slate-500">মোট আদায়</p>
          <p className="text-base font-black text-emerald-600 mt-0.5">
            {formatCurrency(filterPaidAmount, company.currencySymbol)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
          <p className="text-[11px] font-bold text-slate-500">মোট বকেয়া</p>
          <p className="text-base font-black text-red-600 mt-0.5">
            {formatCurrency(filterDueAmount, company.currencySymbol)}
          </p>
        </div>
      </div>

      {/* Invoice Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">কোনো ইনভয়েস পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1">
              অনুগ্রহ করে ভিন্ন কী-ওয়ার্ড দিয়ে সার্চ করুন অথবা নতুন ইনভয়েস তৈরি করুন।
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ফিল্টার রিসেট করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/60">
                  <th className="py-3 px-3">ইনভয়েস নং</th>
                  <th className="py-3 px-3">তারিখ</th>
                  <th className="py-3 px-3">ডিলারের নাম ও মোবাইল</th>
                  <th className="py-3 px-3 text-right">আইটেম (পরিমাণ)</th>
                  <th className="py-3 px-3 text-right">নিট প্রদেয়</th>
                  <th className="py-3 px-3 text-right">পরিশোধিত</th>
                  <th className="py-3 px-3 text-right">বকেয়া</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onViewInvoice(inv)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    {/* Invoice No */}
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                      {inv.invoiceNo}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {formatDateDMY(inv.date)}
                    </td>

                    {/* Dealer */}
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-900">{inv.dealerName}</p>
                      {inv.dealerPhone && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          {inv.dealerPhone}
                        </p>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      {inv.totalItems} টি ({inv.totalQuantity})
                    </td>

                    {/* Net Payable */}
                    <td className="py-3.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(inv.netPayable, company.currencySymbol)}
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(inv.paidAmount, company.currencySymbol)}
                    </td>

                    {/* Due Amount */}
                    <td className="py-3.5 px-3 text-right font-bold whitespace-nowrap">
                      <span
                        className={
                          inv.dueAmount > 0 ? 'text-red-600' : 'text-slate-400'
                        }
                      >
                        {formatCurrency(inv.dueAmount, company.currencySymbol)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
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
                            <CheckCircle2 className="w-2.5 h-2.5" /> পেইড
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

                    {/* Actions */}
                    <td
                      className="py-3.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition"
                          title="View / Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* PDF Quick Download */}
                        <button
                          onClick={(e) => handleQuickPDF(e, inv)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition"
                          title="PDF Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteId(inv.id)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title={isBangla ? 'ইনভয়েস মুছে ফেলার নিশ্চয়তা' : 'Delete Invoice'}
        message={
          isBangla
            ? 'আপনি কি নিশ্চিত যে এই ইনভয়েসটি সম্পূর্ণ ডিলিট করতে চান? এটি আর ফিরিয়ে আনা যাবে না।'
            : 'Are you sure you want to permanently delete this invoice?'
        }
        confirmLabel={t.yesDelete}
        cancelLabel={t.cancel}
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
