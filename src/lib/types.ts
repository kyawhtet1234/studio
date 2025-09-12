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
  date: Date;
  storeId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
};

export type PurchaseTransaction = {
  id: string;
  date: Date;
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
  date: Date;
  fromStoreId: string;
  toStoreId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
};
