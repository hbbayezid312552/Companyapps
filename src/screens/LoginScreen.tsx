import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { loginAdmin } from '../services/auth';
import { AuthSession } from '../types/auth';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface Props {
  onLoginSuccess: (session: AuthSession) => void;
  language: Language;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess, language }) => {
  const t = translations[language];
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await loginAdmin(email, password);
      if (session) {
        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess(session);
        }, 400);
      } else {
        setError(
          language === 'bn'
            ? 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়! অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
            : 'Invalid email or password! Please check and try again.'
        );
      }
    } catch {
      setError(
        language === 'bn'
          ? 'লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Login encountered an error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoCreds = () => {
    setEmail('admin@company.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card Header with Brand Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/30">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Smart Invoice Manager
          </h1>
          <p className="mt-1 text-sm text-blue-200/80">
            {language === 'bn'
              ? 'স্মার্ট ইনভয়েস ও ডিলার ম্যানেজমেন্ট সিস্টেম'
              : 'Dealer & Commercial Invoice Management System'}
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-white/95 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                {t.adminLogin}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'bn'
                  ? 'নিরাপদ অ্যাকাউন্ট প্রমাণীকরণ'
                  : 'Secure Admin Authentication'}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              Offline First
            </span>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{t.loginSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'bn' ? 'অ্যাডমিন ইমেইল' : 'Admin Email'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  যাচাই করা হচ্ছে...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t.login}
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-center">
            <p className="text-xs font-bold text-slate-700">
              {language === 'bn' ? 'ডিফল্ট অ্যাডমিন এক্সেস' : 'Default Admin Access'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Email: <span className="font-mono text-blue-700 font-bold">admin@company.com</span>
              <br />
              Pass: <span className="font-mono text-blue-700 font-bold">admin123</span>
            </p>
            <button
              type="button"
              onClick={handleUseDemoCreds}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              {language === 'bn' ? 'এই ক্রেডেনশিয়াল পূরণ করুন' : 'Fill demo credentials'}
            </button>
            <p className="text-[10px] text-slate-400 mt-1">
              (লগইন করার পর সেটিংস থেকে সহজেই পাসওয়ার্ড পরিবর্তন করা যাবে)
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="mt-4 text-center text-xs text-slate-400">
          🔒 Secure SHA-256 Web Crypto Hashing • No Paid Cloud Required
        </p>
      </div>
    </div>
  );
};
