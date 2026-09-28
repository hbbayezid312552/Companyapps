import React, { useEffect, useState } from 'react';
import { ActiveScreen, CompanySettings, Dealer, FeatureLocks, Invoice, Language, Product } from './types';
import { AuthSession } from './types/auth';
import { getCurrentSession, logoutAdmin } from './services/auth';
import {
  deleteDealer,
  deleteInvoice,
  deleteProduct,
  getCompanySettings,
  getDealers,
  getFeatureLocks,
  getInvoices,
  getProducts,
  saveCompanySettings,
  saveDealer,
  saveFeatureLocks,
  saveProduct,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InvoicePrintView } from './components/InvoicePrintView';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { InvoiceCreateScreen } from './screens/InvoiceCreateScreen';
import { InvoiceListScreen } from './screens/InvoiceListScreen';
import { ProductManagementScreen } from './screens/ProductManagementScreen';
import { DealerManagementScreen } from './screens/DealerManagementScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { AdminSettingsScreen } from './screens/AdminSettingsScreen';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [language, setLanguage] = useState<Language>('bn');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');

  // Domain Data State
  const [company, setCompany] = useState<CompanySettings>(() => getCompanySettings());
  const [featureLocks, setFeatureLocks] = useState<FeatureLocks>(() => getFeatureLocks());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [dealers, setDealers] = useState<Dealer[]>(() => getDealers());

  // In-flight viewing / editing
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Sync state on change
  const reloadData = () => {
    setCompany(getCompanySettings());
    setFeatureLocks(getFeatureLocks());
    setInvoices(getInvoices());
    setProducts(getProducts());
    setDealers(getDealers());
  };

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    reloadData();
  };

  const handleLogout = () => {
    logoutAdmin();
    setSession(null);
    setViewingInvoice(null);
    setEditingInvoice(null);
    setActiveScreen('dashboard');
  };

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  // Invoice Handlers
  const handleSaveInvoiceSuccess = (savedInv: Invoice, andPrint = false) => {
    setInvoices(getInvoices());
    setCompany(getCompanySettings());
    setEditingInvoice(null);

    if (andPrint) {
      setViewingInvoice(savedInv);
      setTimeout(() => {
        window.print();
      }, 350);
    } else {
      setViewingInvoice(savedInv);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    deleteInvoice(id);
    setInvoices(getInvoices());
    if (viewingInvoice?.id === id) {
      setViewingInvoice(null);
    }
  };

  const handleStartEditInvoice = (inv: Invoice) => {
    setViewingInvoice(null);
    setEditingInvoice(inv);
    setActiveScreen('new-invoice');
  };

  // Product Handlers
  const handleSaveProduct = (prod: Product) => {
    saveProduct(prod);
    setProducts(getProducts());
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    setProducts(getProducts());
  };

  // Dealer Handlers
  const handleSaveDealer = (d: Dealer) => {
    saveDealer(d);
    setDealers(getDealers());
  };

  const handleDeleteDealer = (id: string) => {
    deleteDealer(id);
    setDealers(getDealers());
  };

  // Company and Feature Locks Update
  const handleUpdateCompany = (updated: CompanySettings) => {
    saveCompanySettings(updated);
    setCompany(updated);
  };

  const handleUpdateFeatureLocks = (updated: FeatureLocks) => {
    saveFeatureLocks(updated);
    setFeatureLocks(updated);
  };

  // Filter dealer invoices navigation helper
  const handleViewDealerInvoices = (dealerName: string) => {
    setViewingInvoice(null);
    setActiveScreen('invoices');
  };

  // If not logged in, render Secure Admin Login Screen
  if (!session) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} language={language} />
        <OfflineIndicator isBangla={language === 'bn'} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        company={company}
        session={session}
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar Drawer */}
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={(screen) => {
            setViewingInvoice(null);
            setEditingInvoice(null);
            setActiveScreen(screen);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          language={language}
          featureLocks={featureLocks}
          invoiceCount={invoices.length}
          productCount={products.length}
          dealerCount={dealers.length}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Active Printable Preview Mode */}
          {viewingInvoice ? (
            <InvoicePrintView
              invoice={viewingInvoice}
              company={company}
              onBack={() => setViewingInvoice(null)}
              onEdit={handleStartEditInvoice}
              onDelete={handleDeleteInvoice}
              isBangla={language === 'bn'}
            />
          ) : (
            <>
              {activeScreen === 'dashboard' && (
                <DashboardScreen
                  invoices={invoices}
                  products={products}
                  dealers={dealers}
                  company={company}
                  featureLocks={featureLocks}
                  language={language}
                  onNavigate={(screen) => {
                    setEditingInvoice(null);
                    setActiveScreen(screen);
                  }}
                  onViewInvoice={(inv) => setViewingInvoice(inv)}
                />
              )}

              {activeScreen === 'new-invoice' && (
                <InvoiceCreateScreen
                  products={products}
                  dealers={dealers}
                  company={company}
                  editingInvoice={editingInvoice}
                  onSaveSuccess={handleSaveInvoiceSuccess}
                  onCancel={() => {
                    setEditingInvoice(null);
                    setActiveScreen('dashboard');
                  }}
                  language={language}
                />
              )}

              {activeScreen === 'invoices' && (
                <InvoiceListScreen
                  invoices={invoices}
                  company={company}
                  language={language}
                  onViewInvoice={(inv) => setViewingInvoice(inv)}
                  onEditInvoice={handleStartEditInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onNavigateNewInvoice={() => {
                    setEditingInvoice(null);
                    setActiveScreen('new-invoice');
                  }}
                />
              )}

              {activeScreen === 'products' && (
                <ProductManagementScreen
                  products={products}
                  company={company}
                  language={language}
                  onSaveProduct={handleSaveProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

              {activeScreen === 'dealers' && (
                <DealerManagementScreen
                  dealers={dealers}
                  invoices={invoices}
                  company={company}
                  language={language}
                  onSaveDealer={handleSaveDealer}
                  onDeleteDealer={handleDeleteDealer}
                  onViewDealerInvoices={handleViewDealerInvoices}
                />
              )}

              {activeScreen === 'reports' && (
                <ReportsScreen
                  invoices={invoices}
                  dealers={dealers}
                  products={products}
                  company={company}
                  featureLocks={featureLocks}
                  language={language}
                  onNavigateSettings={() => setActiveScreen('settings')}
                />
              )}

              {activeScreen === 'settings' && (
                <AdminSettingsScreen
                  company={company}
                  featureLocks={featureLocks}
                  language={language}
                  onUpdateCompany={handleUpdateCompany}
                  onUpdateFeatureLocks={handleUpdateFeatureLocks}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Offline Connectivity Notification */}
      <OfflineIndicator isBangla={language === 'bn'} />
    </div>
  );
}
