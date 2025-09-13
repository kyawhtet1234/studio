import type { Product, Store, Category, Supplier, InventoryItem, SaleTransaction } from './types';

export const storesData: Store[] = [
  { id: 'store-1', name: 'Main Street Store', location: '123 Main St, Anytown' },
  { id: 'store-2', name: 'Downtown Branch', location: '456 Central Ave, Anytown' },
];

export const categoriesData: Category[] = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Groceries' },
  { id: 'cat-3', name: 'Apparel' },
];

export const suppliersData: Supplier[] = [
  { id: 'sup-1', name: 'Tech Supplies Inc.' },
  { id: 'sup-2', name: 'Fresh Foods Co.' },
  { id: 'sup-3', name: 'Fashion Forward' },
];

export const productsData: Product[] = [
  { id: 'prod-1', sku: 'ELEC-001', name: 'Wireless Mouse', categoryId: 'cat-1', supplierId: 'sup-1', sellPrice: 29.99, buyPrice: 15.00 },
  { id: 'prod-2', sku: 'ELEC-002', name: 'USB-C Hub', categoryId: 'cat-1', supplierId: 'sup-1', sellPrice: 49.99, buyPrice: 25.00 },
  { id: 'prod-3', sku: 'GROC-001', name: 'Organic Apples (1kg)', categoryId: 'cat-2', supplierId: 'sup-2', sellPrice: 5.99, buyPrice: 2.50 },
  { id: 'prod-4', sku: 'GROC-002', name: 'Artisan Bread', categoryId: 'cat-2', supplierId: 'sup-2', sellPrice: 4.50, buyPrice: 1.80 },
  { id: 'prod-5', sku: 'APPA-001', name: 'Men\'s T-Shirt', categoryId: 'cat-3', supplierId: 'sup-3', sellPrice: 19.99, buyPrice: 8.00 },
  { id: 'prod-6', sku: 'APPA-002', name: 'Women\'s Jeans', categoryId: 'cat-3', supplierId: 'sup-3', sellPrice: 89.99, buyPrice: 40.00 },
];

export const inventoryData: InventoryItem[] = [
  { productId: 'prod-1', storeId: 'store-1', stock: 50 },
  { productId: 'prod-1', storeId: 'store-2', stock: 25 },
  { productId: 'prod-2', storeId: 'store-1', stock: 30 },
  { productId: 'prod-3', storeId: 'store-1', stock: 100 },
  { productId: 'prod-4', storeId: 'store-1', stock: 80 },
  { productId: 'prod-5', storeId: 'store-2', stock: 60 },
  { productId: 'prod-6', storeId: 'store-2', stock: 40 },
];

export function generateSalesData(products: Product[], stores: Store[]): SaleTransaction[] {
    return Array.from({ length: 50 }, (_, i) => {
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - (i % 30));
        const itemsCount = Math.floor(Math.random() * 3) + 1;
        
        const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
        
        const saleItems = shuffledProducts.slice(0, itemsCount).map((p) => {
          const quantity = Math.floor(Math.random() * 3) + 1;
          return {
            productId: p.id,
            name: p.name,
            sku: p.sku,
            sellPrice: p.sellPrice,
            quantity: quantity,
            total: p.sellPrice * quantity,
          }
        });
        
        const subtotal = saleItems.reduce((acc, item) => acc + item.total, 0);
        const discount = Math.random() > 0.7 ? parseFloat((subtotal * (Math.random() * 0.1 + 0.05)).toFixed(2)) : 0;
        
        return {
            id: `sale-${i + 1}-${Math.random()}`,
            date: saleDate,
            storeId: stores[i % stores.length].id,
            items: saleItems,
            subtotal: subtotal,
            discount: discount,
            total: subtotal - discount,
        }
    });
}
