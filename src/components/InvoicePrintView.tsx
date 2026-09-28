import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  FileText,
  Printer,
  Share2,
  Trash2,
} from 'lucide-react';
import { CompanySettings, Invoice } from '../types';
import { formatCurrency, formatDateDMY } from '../utils/formatters';
import { exportInvoicePDF, printInvoiceDirect } from '../services/pdf';

interface Props {
  invoice: Invoice;
  company: CompanySettings;
  onBack: () => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  isBangla?: boolean;
}

export const InvoicePrintView: React.FC<Props> = ({
  invoice,
  company,
  onBack,
  onEdit,
  onDelete,
  isBangla = true,
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'thermal'>('a4');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleShare = async () => {
    const summary = `${company.name}\nইনভয়েস নং: ${invoice.invoiceNo}\nতারিখ: ${formatDateDMY(
      invoice.date
    )}\nডিলার: ${invoice.dealerName}\nমোট পরিমাণ: ${formatCurrency(
      invoice.netPayable,
      company.currencySymbol
    )}\nপরিশোধিত: ${formatCurrency(invoice.paidAmount, company.currencySymbol)}\nবকেয়া: ${formatCurrency(
      invoice.dueAmount,
      company.currencySymbol
    )}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo} - ${company.name}`,
          text: summary,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(summary);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
      }
    } else {
      await navigator.clipboard.writeText(summary);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleDownloadPDF = () => {
    exportInvoicePDF(invoice, company);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBangla ? 'তালিকায় ফিরুন' : 'Back to Invoices'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Paper Size selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPaperSize('a4')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                paperSize === 'a4'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 সাইজ
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('thermal')}
              className={`rounded-lg px-2.5 py-1.5 transition ${
                paperSize === 'thermal'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              থার্মাল রিসিট
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Share summary"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>{copyFeedback ? (isBangla ? 'কপি হয়েছে!' : 'Copied!') : (isBangla ? 'শেয়ার' : 'Share')}</span>
          </button>

          {/* PDF Download */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>PDF ডাউনলোড</span>
          </button>

          {/* Print */}
          <button
            onClick={printInvoiceDirect}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>সরাসরি প্রিন্ট</span>
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(invoice)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs md:text-sm font-semibold text-amber-700 hover:bg-amber-100 transition"
            >
              <Edit className="w-4 h-4" />
              <span>{isBangla ? 'এডিট' : 'Edit'}</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(invoice.id)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs md:text-sm font-semibold text-red-600 hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isBangla ? 'ডিলিট' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Document Area */}
      <div
        className={`printable-invoice-container mx-auto transition-all ${
          paperSize === 'thermal'
            ? 'max-w-[420px] bg-white p-5 border border-slate-300 shadow-md text-xs'
            : 'max-w-4xl bg-white p-8 md:p-12 border border-slate-200 shadow-lg rounded-2xl'
        }`}
      >
        {/* Header Section */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-14 w-auto object-contain mb-2"
                />
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-bold tracking-wider mb-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  OFFICIAL INVOICE
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {company.banglaName || company.name}
              </h1>
              {company.banglaName && company.name && (
                <p className="text-xs md:text-sm font-semibold text-slate-600 tracking-wide uppercase">
                  {company.name}
                </p>
              )}
              {company.tagline && (
                <p className="text-xs text-slate-500 italic">{company.tagline}</p>
              )}
              <p className="text-xs text-slate-600 max-w-md pt-1">
                {company.address}
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">ফোন:</span> {company.phone}
                {company.email && (
                  <span className="ml-2">
                    | <span className="font-semibold">ইমেইল:</span> {company.email}
                  </span>
                )}
              </p>
            </div>

            {/* Invoice Meta Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:min-w-[240px] text-right space-y-2">
              <div className="inline-block bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                চালান / ইনভয়েস
              </div>
              <div className="text-xs text-slate-600">
                <span className="text-slate-500">ইনভয়েস নং:</span>{' '}
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {invoice.invoiceNo}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                <span className="text-slate-500">তারিখ:</span>{' '}
                <span className="font-bold text-slate-800">
                  {formatDateDMY(invoice.date)}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                <span className="text-slate-500">পেমেন্ট মাধ্যম:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {invoice.paymentMethod || 'Cash'}
                </span>
              </div>
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    invoice.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoice.paymentStatus === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {invoice.paymentStatus === 'paid' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> পরিশোধিত
                    </>
                  ) : invoice.paymentStatus === 'partial' ? (
                    <>
                      <Clock className="w-3 h-3" /> আংশিক পরিশোধ
                    </>
                  ) : (
                    'বকেয়া / বাকি'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Information Box */}
        <div className="mt-5 rounded-xl bg-blue-50/60 border border-blue-100 p-4">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
            প্রাপক / ডিলারের তথ্য (Billed To):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-sm font-bold text-slate-900">{invoice.dealerName}</p>
              {invoice.dealerPhone && (
                <p className="text-slate-700 mt-0.5">
                  <span className="font-medium text-slate-500">মোবাইল:</span>{' '}
                  <span className="font-mono">{invoice.dealerPhone}</span>
                </p>
              )}
            </div>
            <div>
              {invoice.dealerAddress && (
                <p className="text-slate-700">
                  <span className="font-medium text-slate-500">ঠিকানা:</span>{' '}
                  {invoice.dealerAddress}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Excel-like Product Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold">
                <th className="py-2.5 px-3 border border-slate-700 text-center w-12">
                  ক্রমিক
                </th>
                <th className="py-2.5 px-3 border border-slate-700">
                  প্রোডাক্ট নাম
                </th>
                <th className="py-2.5 px-3 border border-slate-700 text-center w-24">
                  কোড/SKU
                </th>
                <th className="py-2.5 px-3 border border-slate-700 text-center w-16">
                  পরিমাণ
                </th>
                <th className="py-2.5 px-3 border border-slate-700 text-right w-24">
                  প্রোডাক্ট প্রাইজ (MRP)
                </th>
                <th className="py-2.5 px-3 border border-slate-700 text-center w-16">
                  %
                </th>
                <th className="py-2.5 px-3 border border-slate-700 text-right w-24">
                  ডিলার প্রাইজ
                </th>
                <th className="py-2.5 px-3 border border-slate-700 text-right w-28">
                  হিসাব / মোট
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className={`border-b border-slate-200 transition ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-medium text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 font-semibold text-slate-900">
                    {item.productName}
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-mono text-slate-500">
                    {item.productCode || '-'}
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-right font-medium text-slate-600">
                    {formatCurrency(item.mrpPrice, company.currencySymbol)}
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-semibold text-blue-600">
                    {item.percent}%
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-right font-semibold text-slate-800">
                    {formatCurrency(item.dealerPrice, company.currencySymbol)}
                  </td>
                  <td className="py-2.5 px-3 border border-slate-200 text-right font-bold text-slate-900">
                    {formatCurrency(item.total, company.currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Calculations and Summaries */}
        <div className="mt-6 flex flex-col md:flex-row justify-between gap-6 items-start">
          {/* Notes and Terms */}
          <div className="w-full md:w-1/2 space-y-3">
            {invoice.notes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="text-xs font-bold text-slate-700 uppercase mb-1">
                  বিশেষ দ্রষ্টব্য / নোট:
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {invoice.notes}
                </p>
              </div>
            )}

            {company.termsAndConditions && (
              <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500">
                <div className="font-bold text-slate-700 uppercase mb-1">
                  শর্তাবলী:
                </div>
                <p className="whitespace-pre-line leading-relaxed">
                  {company.termsAndConditions}
                </p>
              </div>
            )}
          </div>

          {/* Real-time Summary Card */}
          <div className="w-full md:w-5/12 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-600 pb-1 border-b border-slate-200">
              <span>মোট আইটেম / পরিমাণ:</span>
              <span className="font-bold text-slate-900">
                {invoice.totalItems} টি ({invoice.totalQuantity} একক)
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>মোট প্রাইজ (গ্রস MRP):</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(invoice.grossAmount, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-red-600">
              <span>মোট ডিলার কমিশন / ছাড়:</span>
              <span className="font-bold">
                - {formatCurrency(invoice.totalDiscount, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm font-bold bg-blue-100/70 border border-blue-200 rounded-xl px-3 py-2 text-blue-900">
              <span>নিট প্রদেয় বিল (Net Payable):</span>
              <span className="text-base text-blue-950 font-black">
                {formatCurrency(invoice.netPayable, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-emerald-700 pt-1">
              <span>পরিশোধিত টাকা (Paid):</span>
              <span className="font-bold">
                {formatCurrency(invoice.paidAmount, company.currencySymbol)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200">
              <span className={invoice.dueAmount > 0 ? 'text-red-600' : 'text-slate-700'}>
                বকেয়া টাকা (Due Balance):
              </span>
              <span
                className={`text-sm font-black ${
                  invoice.dueAmount > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {formatCurrency(invoice.dueAmount, company.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Required Signatures Section: Two side-by-side boxes */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-8 items-end text-center">
            {/* Left Signature: Company Chairman */}
            <div className="space-y-2">
              <div className="h-14 flex items-end justify-center">
                <div className="w-56 border-b border-slate-400"></div>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {invoice.chairmanSignatureTitle || 'কোম্পানি চেয়ারম্যান / অনুমোদিত স্বাক্ষর'}
              </p>
              <p className="text-[11px] text-slate-500">
                {company.chairmanName ? `${company.chairmanName}` : company.name}
              </p>
            </div>

            {/* Right Signature: Receiving Dealer */}
            <div className="space-y-2">
              <div className="h-14 flex items-end justify-center">
                <div className="w-56 border-b border-slate-400"></div>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {invoice.dealerSignatureTitle || 'গ্রহীতা ডিলারের স্বাক্ষর'}
              </p>
              <p className="text-[11px] text-slate-500">
                (সিল ও তারিখসহ প্রাপ্তি স্বীকার)
              </p>
            </div>
          </div>
        </div>

        {/* System footer */}
        <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
          Powered by Smart Invoice Manager • সম্পূর্ণ ফ্রি ও অফলাইন অ্যান্ড্রয়েড ইনভয়েস সিস্টেম
        </div>
      </div>
    </div>
  );
};
