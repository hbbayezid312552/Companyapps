import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit,
  Package,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { CompanySettings, Language, Product } from '../types';
import { formatCurrency, round } from '../utils/formatters';
import { translations } from '../utils/translations';
import { ConfirmModal } from '../components/ConfirmModal';

interface Props {
  products: Product[];
  company: CompanySettings;
  language: Language;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductManagementScreen: React.FC<Props> = ({
  products,
  company,
  language,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const t = translations[language];
  const isBangla = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'সাধারণ খাদ্য',
    mrpPrice: 100,
    defaultPercent: company.defaultPercent || 10,
    dealerPrice: 90,
    unit: 'পিস',
    stock: 100,
    status: 'active' as 'active' | 'inactive',
  });

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Recalculate dealer price inside modal
  const handleMRPChange = (mrp: number) => {
    const dp = round(mrp - (mrp * formData.defaultPercent) / 100);
    setFormData((prev) => ({
      ...prev,
      mrpPrice: mrp,
      dealerPrice: dp,
    }));
  };

  const handlePercentChange = (pct: number) => {
    const dp = round(formData.mrpPrice - (formData.mrpPrice * pct) / 100);
    setFormData((prev) => ({
      ...prev,
      defaultPercent: pct,
      dealerPrice: dp,
    }));
  };

  const handleDealerPriceChange = (dp: number) => {
    let pct = formData.defaultPercent;
    if (formData.mrpPrice > 0) {
      pct = round(((formData.mrpPrice - dp) / formData.mrpPrice) * 100, 1);
    }
    setFormData((prev) => ({
      ...prev,
      dealerPrice: dp,
      defaultPercent: pct,
    }));
  };

  const handleOpenAddModal = () => {
    const defaultMRP = 100;
    const defaultPct = company.defaultPercent || 10;
    const defaultDP = round(defaultMRP - (defaultMRP * defaultPct) / 100);

    setEditingProduct(null);
    setFormData({
      code: `PRD-${String(products.length + 101)}`,
      name: '',
      category: 'সাধারণ খাদ্য',
      mrpPrice: defaultMRP,
      defaultPercent: defaultPct,
      dealerPrice: defaultDP,
      unit: 'পিস',
      stock: 100,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      category: p.category || 'সাধারণ',
      mrpPrice: p.mrpPrice,
      defaultPercent: p.defaultPercent,
      dealerPrice: p.dealerPrice,
      unit: p.unit || 'পিস',
      stock: p.stock || 0,
      status: p.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const saved: Product = {
      id: editingProduct?.id || `prod_${Date.now()}`,
      code: formData.code.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      category: formData.category.trim(),
      mrpPrice: Number(formData.mrpPrice) || 0,
      defaultPercent: Number(formData.defaultPercent) || 0,
      dealerPrice: Number(formData.dealerPrice) || 0,
      unit: formData.unit.trim() || 'পিস',
      stock: Number(formData.stock) || 0,
      status: formData.status,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(saved);
    setIsModalOpen(false);
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-3xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            {t.products}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isBangla
              ? 'প্রোডাক্টের নাম, MRP প্রাইজ ও ডিলার কমিশন % কনফিগারেশন'
              : 'Manage products, MRP prices and default dealer commission percentage'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addProductBtn}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="প্রোডাক্ট নাম বা কোড দিয়ে খুঁজুন..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 pl-10 pr-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50/50 py-2 px-3 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Product List Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-1">
              নতুন প্রোডাক্ট যোগ করতে উপরের বাটন চাপুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/60">
                  <th className="py-3 px-3">কোড / SKU</th>
                  <th className="py-3 px-3">প্রোডাক্টের নাম</th>
                  <th className="py-3 px-3">ক্যাটাগরি</th>
                  <th className="py-3 px-3 text-right">MRP প্রাইজ</th>
                  <th className="py-3 px-3 text-center">কমিশন (%)</th>
                  <th className="py-3 px-3 text-right">ডিলার প্রাইজ</th>
                  <th className="py-3 px-3 text-center">একক (Unit)</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                      {formatCurrency(p.mrpPrice, company.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-blue-600">
                      {p.defaultPercent}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-emerald-800">
                      {formatCurrency(p.dealerPrice, company.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                      {p.unit}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700 transition"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {editingProduct ? 'প্রোডাক্ট সম্পাদন করুন' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    প্রোডাক্ট কোড / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="যেমন: মসলা, তেল, খাদ্য"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রোডাক্টের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: প্রিমিয়াম খাঁটি সরিষার তেল (১ লিটার)"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Price & Calculation Triplets */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    MRP প্রাইজ ({company.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.mrpPrice}
                    onChange={(e) => handleMRPChange(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-blue-700 mb-1">
                    কমিশন (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.defaultPercent}
                    onChange={(e) =>
                      handlePercentChange(Number(e.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-blue-300 bg-white p-2 font-bold text-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">
                    ডিলার প্রাইজ (অটো)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.dealerPrice}
                    onChange={(e) =>
                      handleDealerPriceChange(Number(e.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-emerald-300 bg-white p-2 font-black text-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    পরিমাপের একক (Unit)
                  </label>
                  <input
                    type="text"
                    placeholder="পিস / বোতল / প্যাকেট / কেজি / কার্টুন"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
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
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-md"
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
        title="প্রোডাক্ট মুছে ফেলা"
        message="আপনি কি নিশ্চিত যে এই প্রোডাক্টটি তালিকা থেকে ডিলিট করতে চান?"
        confirmLabel="হ্যাঁ, ডিলিট করুন"
        cancelLabel="বাতিল"
        isDanger={true}
        onConfirm={() => {
          if (deleteId) {
            onDeleteProduct(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
