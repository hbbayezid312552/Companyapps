import {
  CompanySettings,
  Dealer,
  FeatureLocks,
  Invoice,
  Product,
} from '../types';
import {
  initialCompanySettings,
  initialFeatureLocks,
  sampleDealers,
  sampleInvoices,
  sampleProducts,
} from './sampleData';

const KEYS = {
  INVOICES: 'sim_invoices_v1',
  PRODUCTS: 'sim_products_v1',
  DEALERS: 'sim_dealers_v1',
  COMPANY: 'sim_company_settings_v1',
  FEATURE_LOCKS: 'sim_feature_locks_v1',
  INITIALIZED: 'sim_initialized_v1',
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to parse ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

// Ensure database is bootstrapped with clean starter data if first run
export function initializeStorageIfNeeded(): void {
  const isInit = localStorage.getItem(KEYS.INITIALIZED);
  if (!isInit) {
    safeSet(KEYS.COMPANY, initialCompanySettings);
    safeSet(KEYS.FEATURE_LOCKS, initialFeatureLocks);
    safeSet(KEYS.PRODUCTS, sampleProducts);
    safeSet(KEYS.DEALERS, sampleDealers);
    safeSet(KEYS.INVOICES, sampleInvoices);
    localStorage.setItem(KEYS.INITIALIZED, 'true');
  }
}

// ---------------- Invoices ----------------
export function getInvoices(): Invoice[] {
  initializeStorageIfNeeded();
  return safeParse<Invoice[]>(KEYS.INVOICES, []);
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = getInvoices();
  return invoices.find((inv) => inv.id === id);
}

export function saveInvoice(invoice: Invoice): Invoice {
  const invoices = getInvoices();
  const existingIdx = invoices.findIndex((inv) => inv.id === invoice.id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    invoices[existingIdx] = { ...invoice, updatedAt: now };
  } else {
    invoices.unshift({
      ...invoice,
      createdAt: invoice.createdAt || now,
      updatedAt: now,
    });
    // Increment company invoice sequence
    const company = getCompanySettings();
    company.nextInvoiceSequence += 1;
    saveCompanySettings(company);
  }

  safeSet(KEYS.INVOICES, invoices);
  return invoice;
}

export function deleteInvoice(id: string): boolean {
  const invoices = getInvoices();
  const filtered = invoices.filter((inv) => inv.id !== id);
  if (filtered.length !== invoices.length) {
    safeSet(KEYS.INVOICES, filtered);
    return true;
  }
  return false;
}

export function getNextInvoiceNumber(): string {
  const settings = getCompanySettings();
  const year = new Date().getFullYear();
  const seq = String(settings.nextInvoiceSequence || 1001).padStart(4, '0');
  return `${settings.invoicePrefix || 'INV'}-${year}-${seq}`;
}

// ---------------- Products ----------------
export function getProducts(): Product[] {
  initializeStorageIfNeeded();
  return safeParse<Product[]>(KEYS.PRODUCTS, []);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function saveProduct(product: Product): Product {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  const now = new Date().toISOString();

  if (idx >= 0) {
    products[idx] = { ...product, updatedAt: now };
  } else {
    products.unshift({
      ...product,
      createdAt: product.createdAt || now,
      updatedAt: now,
    });
  }

  safeSet(KEYS.PRODUCTS, products);
  return product;
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length !== products.length) {
    safeSet(KEYS.PRODUCTS, filtered);
    return true;
  }
  return false;
}

// ---------------- Dealers ----------------
export function getDealers(): Dealer[] {
  initializeStorageIfNeeded();
  return safeParse<Dealer[]>(KEYS.DEALERS, []);
}

export function getDealerById(id: string): Dealer | undefined {
  return getDealers().find((d) => d.id === id);
}

export function saveDealer(dealer: Dealer): Dealer {
  const dealers = getDealers();
  const idx = dealers.findIndex((d) => d.id === dealer.id);
  const now = new Date().toISOString();

  if (idx >= 0) {
    dealers[idx] = { ...dealer, updatedAt: now };
  } else {
    dealers.unshift({
      ...dealer,
      createdAt: dealer.createdAt || now,
      updatedAt: now,
    });
  }

  safeSet(KEYS.DEALERS, dealers);
  return dealer;
}

export function deleteDealer(id: string): boolean {
  const dealers = getDealers();
  const filtered = dealers.filter((d) => d.id !== id);
  if (filtered.length !== dealers.length) {
    safeSet(KEYS.DEALERS, filtered);
    return true;
  }
  return false;
}

// ---------------- Company Settings ----------------
export function getCompanySettings(): CompanySettings {
  initializeStorageIfNeeded();
  return safeParse<CompanySettings>(KEYS.COMPANY, initialCompanySettings);
}

export function saveCompanySettings(settings: CompanySettings): CompanySettings {
  safeSet(KEYS.COMPANY, settings);
  return settings;
}

// ---------------- Feature Locks ----------------
export function getFeatureLocks(): FeatureLocks {
  initializeStorageIfNeeded();
  return safeParse<FeatureLocks>(KEYS.FEATURE_LOCKS, initialFeatureLocks);
}

export function saveFeatureLocks(locks: FeatureLocks): FeatureLocks {
  safeSet(KEYS.FEATURE_LOCKS, locks);
  return locks;
}
