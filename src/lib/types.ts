

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
};

export type InventoryItem = {
  productId: string;
  storeId: string;
  stock: number;
};

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
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
  status: 'completed' | 'voided' | 'invoice' | 'quotation' | 'paid';
  paymentType: string;
};

export type PurchaseTransaction = {
  id: string;
  date: Date | Timestamp;
  storeId: string;
  supplierId: string;
  items: {
    productId: string;
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

export interface DocumentSettings {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyLogo?: string;
  terms?: string;
  paymentInfo?: string;
}

export interface BusinessSettings {
  invoice?: DocumentSettings;
  quotation?: DocumentSettings;
  receipt?: {
    companyLogo?: string;
  };
}
