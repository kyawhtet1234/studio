

import type { Timestamp } from 'firebase/firestore';

export type Category = {
  id: string;
  name: string;
};

export type Supplier = {
  id: string;
  name: string;
};

export type Store = {
  id: string;
  name: string;
  location: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
};

export type PaymentType = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string;
  sellPrice: number;
  buyPrice: number;
  createdAt: Date | Timestamp;
  variant_track_enabled: boolean;
  available_variants: string[];
  reorderPoint?: number;
};

export type InventoryItem = {
  id: string; // Composite key: `${productId}_${variantName}_${storeId}`
  productId: string;
  variant_name: string; // Empty string for base item
  storeId: string;
  stock: number;
};

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  variant_name: string; // Empty string for base item
  sellPrice: number;
  quantity: number;
  total: number;
};

export type SaleTransaction = {
  id: string;
  date: Date | Timestamp;
  storeId: string;
  customerId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: 'completed' | 'voided' | 'invoice' | 'quotation' | 'partially-paid' | 'paid';
  paymentType: string;
};

export type PurchaseTransaction = {
  id: string;
  date: Date | Timestamp;
  storeId: string;
  supplierId: string;
  items: {
    productId: string;
    variant_name: string; // Empty string for base item
    quantity: number;
    buyPrice: number;
  }[];
  total: number;
};

export type TransferLog = {
  id: string;
  date: Date | Timestamp;
  fromStoreId: string;
  toStoreId: string;
  items: {
    productId: string;
    variant_name: string;
    quantity: number;
  }[];
};

export type ExpenseCategory = {
  id: string;
  name: string;
};

export type Expense = {
    id: string;
    date: Date | Timestamp;
    categoryId: string;
    description: string;
    amount: number;
};

export type CashAccount = {
  id: string;
  name: string;
  type: 'cash' | 'bank';
  balance: number;
};

export type CashTransaction = {
  id: string;
  date: Date | Timestamp;
  accountId: string;
  type: 'deposit' | 'withdrawal' | 'adjustment';
  amount: number;
  description: string;
};

export type CashAllocation = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
};

export type Liability = {
  id: string;
  name: string;
  amount: number;
};

export type Employee = {
  id: string;
  name: string;
  baseSalary: number;
};

export type SalaryAdvance = {
  id: string;
  employeeId: string;
  date: Date | Timestamp;
  amount: number;
  notes?: string;
};

export type LeaveRecord = {
    id: string;
    employeeId: string;
    date: Date | Timestamp;
};

export interface UserRoleSettings {
  isEnabled: boolean;
  permissions: string[]; // e.g., ['/sales', '/products']
  actions?: string[]; // e.g., ['void-sales']
}

export interface UserManagementSettings {
    adminPin?: string;
    salesperson?: UserRoleSettings;
}

export interface DocumentSettings {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
  terms?: string;
  paymentInfo?: string;
}

export interface GoalsSettings {
    dailySalesGoal?: number;
}

export interface BrandingSettings {
  appName?: string;
  appLogo?: string | null;
}

export interface BusinessSettings {
  branding?: BrandingSettings;
  invoice?: DocumentSettings;
  quotation?: DocumentSettings;
  receipt?: {
    companyLogo?: string;
  };
  goals?: GoalsSettings;
  users?: UserManagementSettings;
}
