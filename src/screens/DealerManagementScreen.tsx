import React, { useState } from 'react';
import {
  Edit,
  Eye,
  FileText,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { CompanySettings, Dealer, Invoice, Language } from '../types';
import { formatCurrency } from '../utils/formatters';
import { translations } from '../utils/translations';
import { ConfirmModal } from '../components/ConfirmModal';

interface Props {
  dealers: Dealer[];
  invoices: Invoice[];
  company: CompanySettings;
  language: Language;
  onSaveDealer: (dealer: Dealer) => void;
  onDeleteDealer: (dealerId: string) => void;
  onViewDealerInvoices: (dealerName: string) => void;
}

export const DealerManagementScreen: React.FC<Props> = ({
  dealers,
  invoices,
  company,
  language,
  onSaveDealer,
  onDeleteDealer,
  onViewDealerInvoices,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    businessName: '',
    phone: '',
    altPhone: '',
    address: '',
    zone: '',
    notes: '',
    status: 'active' as 'active' | 'inactive',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calculate invoice count and outstanding balance for a dealer
  const getDealerFinancials = (dealer: Dealer) => {
    const dealerInvoices = invoices.filter(
      (inv) =>
        inv.dealerId === dealer.id ||
        inv.dealerName.toLowerCase().includes(dealer.name.toLowerCase()) ||
        (dealer.businessName &&
          inv.dealerName
            .toLowerCase()
            .includes(dealer.businessName.toLowerCase()))
    );

    const totalInvoiced = dealerInvoices.reduce(
      (sum, inv) => sum + (inv.netPayable || 0),
      0
    );
    const totalPaid = dealerInvoices.reduce(
      (sum, inv) => sum + (inv.paidAmount || 0),
      0
    );
    const totalDue = dealerInvoices.reduce(
      (sum, inv) => sum + (inv.dueAmount || 0),
      0
    );

    return {
      count: dealerInvoices.length,
      totalInvoiced,
      totalPaid,
      totalDue,
    };
  };

  const handleOpenAddModal = () => {
    setEditingDealer(null);
    setFormData({
      code: `DLR-${String(dealers.length + 1).padStart(3, '0')}`,
      name: '',
      businessName: '',
      phone: '',
      altPhone: '',
      address: '',
      zone: '',
      notes: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d: Dealer) => {
    setEditingDealer(d);
    setFormData({
      code: d.code,
      name: d.name,
      businessName: d.businessName,
      phone: d.phone,
      altPhone: d.altPhone || '',
      address: d.address,
      zone: d.zone || '',
      notes: d.notes || '',
      status: d.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const saved: Dealer = {
      id: editingDealer?.id || `dealer_${Date.now()}`,
      code: formData.code.trim() || `DLR-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      businessName: formData.businessName.trim(),
      phone: formData.phone.trim(),
      altPhone: formData.altPhone.trim(),
      address: formData.address.trim(),
      zone: formData.zone.trim(),
      notes: formData.notes.trim(),
      status: formData.status,
      createdAt: editingDealer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveDealer(saved);
    setIsModalOpen(false);
  };

  const filteredDealers = dealers.filter((d) => {
    const query = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(query) ||
      d.businessName.toLowerCase().includes(query) ||
      d.phone.includes(query) ||
      d.code.toLowerCase().includes(query) ||
      d.address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            {t.dealers}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isBangla
              ? 'ডিলারদের দোকান, মোবাইল নম্বর, জোন ও লেজার ব্যালেন্স'
              : 'Dealer directory, contact info, sales ledger, and due balances'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addDealerBtn}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ডিলারের নাম, দোকান, মোবাইল নম্বর বা কোড দিয়ে খুঁজুন..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 pl-10 pr-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Dealers Cards Grid */}
      {filteredDealers.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">কোনো ডিলার পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 mt-1">
            নতুন ডিলার যোগ করতে উপরের বাটন চাপুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDealers.map((d) => {
            const fin = getDealerFinancials(d);
            return (
              <div
                key={d.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {d.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {d.businessName || d.name}
                      </h3>
                      {d.businessName && (
                        <p className="text-xs font-semibold text-slate-600">
                          প্রো: {d.name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        d.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {d.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">
                        {d.phone}
                      </span>
                      {d.altPhone && (
                        <span className="text-[11px] text-slate-400">
                          , {d.altPhone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{d.address || 'ঠিকানা দেওয়া নেই'}</span>
                    </div>

                    {d.zone && (
                      <div className="text-[11px] text-slate-500 pl-5">
                        <span className="font-semibold">জোন:</span> {d.zone}
                      </div>
                    )}

                    {d.notes && (
                      <div className="mt-2 rounded-xl bg-slate-50 p-2 text-[11px] text-slate-500 italic">
                        "{d.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Dealer Financial Box */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 rounded-2xl p-2.5 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500">মোট ক্রয় চালান</p>
                      <p className="font-black text-slate-900">
                        {fin.count} টি ({formatCurrency(fin.totalInvoiced, company.currencySymbol)})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">বকেয়া ব্যালেন্স</p>
                      <p
                        className={`font-black ${
                          fin.totalDue > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(fin.totalDue, company.currencySymbol)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        onViewDealerInvoices(d.businessName || d.name)
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>ইনভয়েস সমূহ</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(d)}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteId(d.id)}
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-red-50 hover:text-red-700 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dealer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {editingDealer ? 'ডিলার সম্পাদন করুন' : 'নতুন ডিলার যুক্ত করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ডিলার কোড *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    দোকান / ফার্মের নাম
                  </label>
                  <input
                    type="text"
                    placeholder="মেসার্স রফিক ব্রাদার্স"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  স্বত্বাধিকারী / ব্যক্তির নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="মো. রফিকুল ইসলাম"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01712-345678"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    বিকল্প মোবাইল
                  </label>
                  <input
                    type="text"
                    placeholder="01811-998877"
                    value={formData.altPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, altPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ঠিকানা *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="চকবাজার, ঢাকা"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    জোন / এলাকা
                  </label>
                  <input
                    type="text"
                    placeholder="ঢাকা দক্ষিণ"
                    value={formData.zone}
                    onChange={(e) =>
                      setFormData({ ...formData, zone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নোটস / পেমেন্ট মন্তব্য
                </label>
                <textarea
                  rows={2}
                  placeholder="ডিলারের সাথে চুক্তি বা লেনদেনের বিবরণ..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  স্ট্যাটাস
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none"
                >
                  <option value="active">সক্রিয় (Active)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 font-bold text-white hover:bg-purple-700 shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="ডিলার মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে এই ডিলারকে তালিকা থেকে ডিলিট করতে চান?"
        confirmLabel="হ্যাঁ, ডিলিট করুন"
        cancelLabel="বাতিল"
        isDanger={true}
        onConfirm={() => {
          if (deleteId) {
            onDeleteDealer(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
