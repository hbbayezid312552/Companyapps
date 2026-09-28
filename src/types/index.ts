export type InvoiceStatus = 'issued' | 'paid' | 'partial' | 'draft' | 'cancelled';
export type PaymentMethod = 'Cash' | 'Bank' | 'bKash' | 'Nagad' | 'Cheque' | 'Credit';

export interface InvoiceItem {
  id: string;
  sl: number;
  productId?: string;
  productName: string;
  productCode?: string;
  quantity: number;
  mrpPrice: number;
  percent: number; // Commission or discount %
  dealerPrice: number; // mrpPrice - (mrpPrice * percent / 100)
  total: number; // dealerPrice * quantity
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  dueDate?: string;
  dealerId: string;
  dealerName: string;
  dealerPhone: string;
  dealerAddress: string;
  items: InvoiceItem[];
  totalItems: number;
  totalQuantity: number;
  grossAmount: number; // sum(mrpPrice * quantity)
  totalDiscount: number; // grossAmount - netPayable
  netPayable: number; // sum(dealerPrice * quantity)
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: InvoiceStatus;
  notes?: string;
  terms?: string;
  chairmanSignatureTitle?: string;
  dealerSignatureTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  mrpPrice: number;
  defaultPercent: number;
  dealerPrice: number;
  unit: string; // pcs, kg, carton, bag, box, litre
  stock?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Dealer {
  id: string;
  code: string;
  name: string;
  businessName: string;
  phone: string;
  altPhone?: string;
  address: string;
  zone?: string;
  email?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  name: string;
  banglaName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  chairmanName: string;
  chairmanTitle: string;
  logoUrl?: string; // Base64 data URL or URL
  currencySymbol: string; // ৳ or Tk
  invoicePrefix: string;
  nextInvoiceSequence: number;
  defaultPercent: number;
  termsAndConditions: string;
  thermalPrintSupported: boolean;
}

export interface FeatureLocks {
  advancedReports: boolean;
  cloudSync: boolean;
  multiUserStaff: boolean;
  profitMarginAnalytics: boolean;
  autoSmsAlerts: boolean;
}

export type ActiveScreen =
  | 'dashboard'
  | 'new-invoice'
  | 'invoices'
  | 'products'
  | 'dealers'
  | 'reports'
  | 'settings'
  | 'locked-feature';

export type Language = 'bn' | 'en';
