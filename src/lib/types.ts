
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

export type Product = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string;
  sellPrice: number;
  buyPrice: number;
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
  status: 'completed' | 'voided';
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

export type Expense = {
    id: string;
    date: Date | Timestamp;
    category: string;
    description: string;
    amount: number;
};
