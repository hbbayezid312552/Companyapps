import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Printer,
  Save,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  CompanySettings,
  Dealer,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Language,
  PaymentMethod,
  Product,
} from '../types';
import { formatCurrency, round } from '../utils/formatters';
import { translations } from '../utils/translations';
import { getNextInvoiceNumber, saveDealer, saveInvoice } from '../services/storage';

interface Props {
  products: Product[];
  dealers: Dealer[];
  company: CompanySettings;
  editingInvoice?: Invoice | null;
  onSaveSuccess: (invoice: Invoice, andPrint?: boolean) => void;
  onCancel: () => void;
  language: Language;
}

export const InvoiceCreateScreen: React.FC<Props> = ({
  products,
  dealers: initialDealers,
  company,
  editingInvoice,
  onSaveSuccess,
  onCancel,
  language,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  const [dealers, setDealers] = useState<Dealer[]>(initialDealers);
  const [showNewDealerModal, setShowNewDealerModal] = useState(false);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState(
    editingInvoice?.invoiceNo || getNextInvoiceNumber()
  );
  const [date, setDate] = useState(
    editingInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [selectedDealerId, setSelectedDealerId] = useState(
    editingInvoice?.dealerId || (dealers.length > 0 ? dealers[0].id : '')
  );
  const [dealerName, setDealerName] = useState(editingInvoice?.dealerName || '');
  const [dealerPhone, setDealerPhone] = useState(editingInvoice?.dealerPhone || '');
  const [dealerAddress, setDealerAddress] = useState(
    editingInvoice?.dealerAddress || ''
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingInvoice?.paymentMethod || 'Cash'
  );
  const [paidAmount, setPaidAmount] = useState<number>(
    editingInvoice?.paidAmount ?? 0
  );
  const [notes, setNotes] = useState(editingInvoice?.notes || '');

  // Table items state
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (editingInvoice?.items && editingInvoice.items.length > 0) {
      return editingInvoice.items;
    }
    // Default initial row
    return [
      {
        id: `item_${Date.now()}_1`,
        sl: 1,
        productId: products.length > 0 ? products[0].id : '',
        productName: products.length > 0 ? products[0].name : '',
        productCode: products.length > 0 ? products[0].code : '',
        quantity: 1,
        mrpPrice: products.length > 0 ? products[0].mrpPrice : 100,
        percent: products.length > 0 ? products[0].defaultPercent : company.defaultPercent || 10,
        dealerPrice: products.length > 0
          ? round(products[0].mrpPrice - (products[0].mrpPrice * products[0].defaultPercent) / 100)
          : 90,
        total: products.length > 0
          ? round((products[0].mrpPrice - (products[0].mrpPrice * products[0].defaultPercent) / 100) * 1)
          : 90,
      },
    ];
  });

  // New dealer quick modal state
  const [newDealerForm, setNewDealerForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    address: '',
  });

  // When selected dealer changes, auto-fill contact info
  useEffect(() => {
    if (!selectedDealerId) return;
    const found = dealers.find((d) => d.id === selectedDealerId);
    if (found) {
      const displayName = found.businessName
        ? `${found.businessName} (${found.name})`
        : found.name;
      setDealerName(displayName);
      setDealerPhone(found.phone);
      setDealerAddress(found.address);
    }
  }, [selectedDealerId, dealers]);

  // Recalculate row items helper
  const updateItemRow = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        item.productId = prod.id;
        item.productName = prod.name;
        item.productCode = prod.code;
        item.mrpPrice = prod.mrpPrice;
        item.percent = prod.defaultPercent;
        const dp = round(prod.mrpPrice - (prod.mrpPrice * prod.defaultPercent) / 100);
        item.dealerPrice = dp;
        item.total = round(dp * item.quantity);
      }
    } else if (field === 'quantity') {
      const qty = Math.max(0, Number(value) || 0);
      item.quantity = qty;
      item.total = round(item.dealerPrice * qty);
    } else if (field === 'mrpPrice') {
      const mrp = Math.max(0, Number(value) || 0);
      item.mrpPrice = mrp;
      const dp = round(mrp - (mrp * item.percent) / 100);
      item.dealerPrice = dp;
      item.total = round(dp * item.quantity);
    } else if (field === 'percent') {
      const pct = Math.max(0, Math.min(100, Number(value) || 0));
      item.percent = pct;
      const dp = round(item.mrpPrice - (item.mrpPrice * pct) / 100);
      item.dealerPrice = dp;
      item.total = round(dp * item.quantity);
    } else if (field === 'dealerPrice') {
      const dp = Math.max(0, Number(value) || 0);
      item.dealerPrice = dp;
      // Reverse compute percentage if MRP > 0
      if (item.mrpPrice > 0) {
        item.percent = round(((item.mrpPrice - dp) / item.mrpPrice) * 100, 1);
      }
      item.total = round(dp * item.quantity);
    } else if (field === 'productName') {
      item.productName = String(value);
    } else if (field === 'productCode') {
      item.productCode = String(value);
    }

    updated[index] = item;
    setItems(updated);
  };

  // Add new row
  const handleAddRow = () => {
    const nextSl = items.length + 1;
    const defaultProd = products.length > 0 ? products[0] : null;

    const mrp = defaultProd ? defaultProd.mrpPrice : 100;
    const pct = defaultProd ? defaultProd.defaultPercent : company.defaultPercent || 10;
    const dp = round(mrp - (mrp * pct) / 100);

    const newRow: InvoiceItem = {
      id: `item_${Date.now()}_${nextSl}`,
      sl: nextSl,
      productId: defaultProd?.id || '',
      productName: defaultProd?.name || '',
      productCode: defaultProd?.code || '',
      quantity: 1,
      mrpPrice: mrp,
      percent: pct,
      dealerPrice: dp,
      total: round(dp * 1),
    };

    setItems([...items, newRow]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    const filtered = items.filter((_, idx) => idx !== index);
    // re-index serial
    const reindexed = filtered.map((item, idx) => ({ ...item, sl: idx + 1 }));
    setItems(reindexed);
  };

  // Real-time Overall Summaries
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const grossAmount = round(
    items.reduce((sum, item) => sum + (item.mrpPrice || 0) * (item.quantity || 0), 0)
  );
  const netPayable = round(items.reduce((sum, item) => sum + (item.total || 0), 0));
  const totalDiscount = round(grossAmount - netPayable);
  const dueAmount = round(Math.max(0, netPayable - (paidAmount || 0)));

  // Payment Status
  let paymentStatus: InvoiceStatus = 'draft';
  if (paidAmount >= netPayable && netPayable > 0) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  } else {
    paymentStatus = 'issued';
  }

  // Quick action: Paid full
  const handleSetPaidFull = () => {
    setPaidAmount(netPayable);
  };

  // Save handler
  const handleSave = (andPrint = false) => {
    if (!dealerName.trim()) {
      alert(isBangla ? 'অনুগ্রহ করে ডিলার নির্বাচন করুন।' : 'Please select or enter dealer name.');
      return;
    }

    if (items.length === 0 || totalQuantity === 0) {
      alert(isBangla ? 'অন্তত একটি প্রোডাক্ট এবং পরিমাণ দিন।' : 'Please add at least one product with quantity.');
      return;
    }

    const newInvoice: Invoice = {
      id: editingInvoice?.id || `inv_${Date.now()}`,
      invoiceNo: invoiceNo.trim() || getNextInvoiceNumber(),
      date,
      dealerId: selectedDealerId || 'custom_dealer',
      dealerName: dealerName.trim(),
      dealerPhone: dealerPhone.trim(),
      dealerAddress: dealerAddress.trim(),
      items,
      totalItems,
      totalQuantity,
      grossAmount,
      totalDiscount,
      netPayable,
      paidAmount: paidAmount || 0,
      dueAmount,
      paymentMethod,
      paymentStatus,
      notes: notes.trim(),
      chairmanSignatureTitle: company.chairmanTitle || 'কোম্পানি চেয়ারম্যান / অনুমোদিত স্বাক্ষর',
      dealerSignatureTitle: 'গ্রহীতা ডিলারের স্বাক্ষর',
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveInvoice(newInvoice);
    onSaveSuccess(newInvoice, andPrint);
  };

  // Quick add dealer modal submit
  const handleCreateNewDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerForm.name.trim()) return;

    const newDealer: Dealer = {
      id: `dealer_${Date.now()}`,
      code: `DLR-${String(dealers.length + 1).padStart(3, '0')}`,
      name: newDealerForm.name.trim(),
      businessName: newDealerForm.businessName.trim(),
      phone: newDealerForm.phone.trim(),
      address: newDealerForm.address.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDealer(newDealer);
    const updated = [newDealer, ...dealers];
    setDealers(updated);
    setSelectedDealerId(newDealer.id);
    setShowNewDealerModal(false);
    setNewDealerForm({ name: '', businessName: '', phone: '', address: '' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isBangla ? 'বাতিল' : 'Cancel'}</span>
          </button>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              {editingInvoice
                ? isBangla
                  ? 'ইনভয়েস সম্পাদনা'
                  : 'Edit Invoice'
                : isBangla
                ? 'নতুন কমার্শিয়াল ইনভয়েস তৈরি'
                : 'Create Commercial Invoice'}
            </h1>
            <p className="text-xs text-slate-500">
              {isBangla
                ? 'Excel-এর মতো অটোমেটিক ডিলার কমিশন ও হিসাব সিস্টেম'
                : 'Excel-like spreadsheet with live dealer price calculations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveInvoice}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t.saveAndPrint}</span>
          </button>
        </div>
      </div>

      {/* Invoice Details Card (Top Info) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          ১. ইনভয়েস ও ডিলার তথ্য (Invoice & Dealer Details)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.date} *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t.invoiceNo} *
              </label>
              <button
                type="button"
                onClick={() => setInvoiceNo(getNextInvoiceNumber())}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                Auto Generate
              </button>
            </div>
            <input
              type="text"
              required
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="INV-2026-0001"
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs font-mono font-bold text-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.companyName}
            </label>
            <input
              type="text"
              disabled
              value={company.name}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-medium text-slate-600 truncate"
            />
          </div>

          {/* Dealer Select Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t.dealerName} *
              </label>
              <button
                type="button"
                onClick={() => setShowNewDealerModal(true)}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                <UserPlus className="w-3 h-3" />
                <span>নতুন ডিলার</span>
              </button>
            </div>
            <select
              value={selectedDealerId}
              onChange={(e) => setSelectedDealerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- ডিলার নির্বাচন করুন --</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.businessName ? `${d.businessName} - ${d.name}` : d.name} (
                  {d.phone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dealer phone & address row */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              ডিলার নাম / ট্রেড নাম (Editable):
            </label>
            <input
              type="text"
              value={dealerName}
              onChange={(e) => setDealerName(e.target.value)}
              placeholder="মেসার্স রফিক ব্রাদার্স"
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {t.dealerPhone}:
            </label>
            <input
              type="text"
              value={dealerPhone}
              onChange={(e) => setDealerPhone(e.target.value)}
              placeholder="017xxxxxxxx"
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {t.dealerAddress}:
            </label>
            <input
              type="text"
              value={dealerAddress}
              onChange={(e) => setDealerAddress(e.target.value)}
              placeholder="চকবাজার, ঢাকা"
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Excel Sheet-like Product Table Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              ২. প্রোডাক্ট তালিকা ও হিসাব (Excel Spreadsheet Table)
            </h2>
            <p className="text-[11px] text-slate-500">
              MRP ও % পরিবর্তনের সাথে সাথে ডিলার প্রাইজ ও মোট হিসাব Real-Time ক্যালকুলেট হচ্ছে
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProductRow}</span>
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-2 text-center w-12 border-r border-slate-200">
                  {t.sl}
                </th>
                <th className="py-3 px-3 min-w-[200px] border-r border-slate-200">
                  {t.productNameCol}
                </th>
                <th className="py-3 px-2 text-center w-24 border-r border-slate-200">
                  {t.codeCol}
                </th>
                <th className="py-3 px-2 text-center w-20 border-r border-slate-200">
                  {t.qtyCol}
                </th>
                <th className="py-3 px-2 text-right w-28 border-r border-slate-200">
                  {t.mrpCol}
                </th>
                <th className="py-3 px-2 text-center w-20 border-r border-slate-200">
                  {t.percentCol}
                </th>
                <th className="py-3 px-2 text-right w-28 border-r border-slate-200">
                  {t.dealerPriceCol}
                </th>
                <th className="py-3 px-3 text-right w-32 border-r border-slate-200">
                  {t.totalCol}
                </th>
                <th className="py-3 px-2 text-center w-12">
                  মুছুন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((row, index) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition">
                  {/* Serial */}
                  <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200">
                    {index + 1}
                  </td>

                  {/* Product Selector / Name */}
                  <td className="py-2 px-2 border-r border-slate-200 space-y-1">
                    <select
                      value={row.productId || ''}
                      onChange={(e) =>
                        updateItemRow(index, 'productId', e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- প্রোডাক্ট নির্বাচন করুন --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (MRP: {p.mrpPrice} | {p.defaultPercent}%)
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={row.productName}
                      onChange={(e) =>
                        updateItemRow(index, 'productName', e.target.value)
                      }
                      placeholder="বা কাস্টম প্রোডাক্টের নাম লিখুন"
                      className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-1 text-[11px] text-slate-700 focus:bg-white focus:outline-none"
                    />
                  </td>

                  {/* Code / SKU */}
                  <td className="py-2 px-2 text-center border-r border-slate-200">
                    <input
                      type="text"
                      value={row.productCode || ''}
                      onChange={(e) =>
                        updateItemRow(index, 'productCode', e.target.value)
                      }
                      placeholder="SKU"
                      className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-center font-mono text-xs text-slate-700 focus:outline-none"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2 px-2 text-center border-r border-slate-200">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        updateItemRow(index, 'quantity', e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </td>

                  {/* Product Price (MRP) */}
                  <td className="py-2 px-2 text-right border-r border-slate-200">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.mrpPrice}
                      onChange={(e) =>
                        updateItemRow(index, 'mrpPrice', e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-right font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </td>

                  {/* Percentage (%) */}
                  <td className="py-2 px-2 text-center border-r border-slate-200">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={row.percent}
                        onChange={(e) =>
                          updateItemRow(index, 'percent', e.target.value)
                        }
                        className="w-full rounded-lg border border-blue-200 bg-blue-50/40 p-1.5 text-center font-bold text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                  </td>

                  {/* Dealer Price (Auto Calculated, but also editable) */}
                  <td className="py-2 px-2 text-right border-r border-slate-200">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.dealerPrice}
                      onChange={(e) =>
                        updateItemRow(index, 'dealerPrice', e.target.value)
                      }
                      className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 p-1.5 text-right font-bold text-emerald-900 focus:bg-white focus:outline-none"
                    />
                  </td>

                  {/* Total Amount for Row */}
                  <td className="py-2 px-3 text-right font-black text-slate-900 border-r border-slate-200">
                    {formatCurrency(row.total, company.currencySymbol)}
                  </td>

                  {/* Delete row */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      disabled={items.length <= 1}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-30"
                      title="Row Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button below table */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-blue-400 bg-blue-50/40 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProductRow}</span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Notes & Real-time Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Notes & Payment Method Settings */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ৩. পেমেন্ট ও নোটস (Payment & Notes)
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.paymentMethod}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="Cash">{t.cash}</option>
                <option value="Bank">{t.bank}</option>
                <option value="bKash">{t.bkash}</option>
                <option value="Nagad">{t.nagad}</option>
                <option value="Cheque">{t.cheque}</option>
                <option value="Credit">{t.credit}</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t.paidAmount} ({company.currencySymbol})
                </label>
                <button
                  type="button"
                  onClick={handleSetPaidFull}
                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  সম্পূর্ণ পরিশোধ
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50/40 p-2.5 text-xs font-bold text-emerald-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.notes}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: বাকী টাকা আগামী সপ্তাহে পরিশোধযোগ্য, অথবা ব্যাংক চেক নম্বর..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Real-time Calculation Summary Card */}
        <div className="lg:col-span-6 rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white p-5 md:p-6 shadow-xs space-y-3.5">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
            <span>৪. স্বয়ংক্রিয় হিসাব বিবরণী (Live Calculations)</span>
            <span className="text-[11px] font-normal text-slate-500">Real-Time</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600 py-1 border-b border-slate-200">
              <span>{t.totalProductsCount}:</span>
              <span className="font-bold text-slate-900">
                {totalItems} আইটেম ({totalQuantity} পিস/একক)
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600 py-1">
              <span>{t.grossTotal} (MRP যোগফল):</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(grossAmount, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center text-red-600 py-1">
              <span>{t.totalDiscount} (মোট ডিলার কমিশন):</span>
              <span className="font-bold">
                - {formatCurrency(totalDiscount, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center bg-blue-600 text-white rounded-2xl p-4 shadow-md shadow-blue-500/20">
              <span className="text-sm font-bold">{t.netPayable}:</span>
              <span className="text-xl font-black">
                {formatCurrency(netPayable, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-700 py-1 pt-2">
              <span className="font-medium">{t.paidAmount}:</span>
              <span className="font-bold">
                {formatCurrency(paidAmount, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">{t.dueAmount}:</span>
              <span
                className={`text-base font-black ${
                  dueAmount > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(dueAmount, company.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveInvoice}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t.saveAndPrint}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Dealer Modal */}
      {showNewDealerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              দ্রুত নতুন ডিলার যুক্ত করুন
            </h3>
            <form onSubmit={handleCreateNewDealer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  দোকান / প্রতিষ্ঠানের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="মেসার্স কাশেম এন্টারপ্রাইজ"
                  value={newDealerForm.businessName}
                  onChange={(e) =>
                    setNewDealerForm({
                      ...newDealerForm,
                      businessName: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  স্বত্বাধিকারী / ব্যক্তির নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="মো. আবুল কাশেম"
                  value={newDealerForm.name}
                  onChange={(e) =>
                    setNewDealerForm({ ...newDealerForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="01712-000000"
                  value={newDealerForm.phone}
                  onChange={(e) =>
                    setNewDealerForm({ ...newDealerForm, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ঠিকানা</label>
                <input
                  type="text"
                  placeholder="নিউ মার্কেট, চট্টগ্রাম"
                  value={newDealerForm.address}
                  onChange={(e) =>
                    setNewDealerForm({
                      ...newDealerForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewDealerModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
