import {
  CompanySettings,
  Dealer,
  FeatureLocks,
  Invoice,
  Product,
} from '../types';
import {
  getCompanySettings,
  getDealers,
  getFeatureLocks,
  getInvoices,
  getProducts,
  saveCompanySettings,
  saveFeatureLocks,
} from './storage';

export interface BackupData {
  version: string;
  exportedAt: string;
  app: string;
  companySettings: CompanySettings;
  featureLocks: FeatureLocks;
  products: Product[];
  dealers: Dealer[];
  invoices: Invoice[];
}

export function exportBackupJSON(): string {
  const data: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    app: 'Smart Invoice Manager',
    companySettings: getCompanySettings(),
    featureLocks: getFeatureLocks(),
    products: getProducts(),
    dealers: getDealers(),
    invoices: getInvoices(),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `smart_invoice_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return jsonStr;
}

export function restoreBackupJSON(
  rawJson: string
): { success: boolean; message: string; count?: { invoices: number; products: number; dealers: number } } {
  try {
    const data: Partial<BackupData> = JSON.parse(rawJson);

    if (!Array.isArray(data.invoices) || !Array.isArray(data.products) || !Array.isArray(data.dealers)) {
      return { success: false, message: 'অকার্যকর ব্যাকআপ ফাইল! প্রয়োজনীয় ডেটা পাওয়া যায়নি।' };
    }

    if (data.companySettings) {
      saveCompanySettings(data.companySettings);
    }
    if (data.featureLocks) {
      saveFeatureLocks(data.featureLocks);
    }

    localStorage.setItem('sim_products_v1', JSON.stringify(data.products));
    localStorage.setItem('sim_dealers_v1', JSON.stringify(data.dealers));
    localStorage.setItem('sim_invoices_v1', JSON.stringify(data.invoices));

    return {
      success: true,
      message: 'ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে!',
      count: {
        invoices: data.invoices.length,
        products: data.products.length,
        dealers: data.dealers.length,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `রিস্টোর ব্যর্থ হয়েছে: ${errMsg}`,
    };
  }
}

export function resetToDemoData(): void {
  localStorage.removeItem('sim_invoices_v1');
  localStorage.removeItem('sim_products_v1');
  localStorage.removeItem('sim_dealers_v1');
  localStorage.removeItem('sim_company_settings_v1');
  localStorage.removeItem('sim_feature_locks_v1');
  localStorage.removeItem('sim_initialized_v1');
  window.location.reload();
}
