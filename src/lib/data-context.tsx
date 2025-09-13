
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Product, Category, Supplier, Store, InventoryItem, SaleTransaction, PurchaseTransaction } from '@/lib/types';

interface DataContextProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    stores: Store[];
    inventory: InventoryItem[];
    sales: SaleTransaction[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    addStore: (store: Omit<Store, 'id'>) => void;
    addSale: (sale: SaleTransaction) => void;
    addPurchase: (purchase: PurchaseTransaction) => void;
    updateInventory: (newInventory: InventoryItem[]) => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { 
        products: initialProducts,
        categories: initialCategories,
        suppliers: initialSuppliers,
        stores: initialStores,
        inventory: initialInventory,
        sales: initialSales
    } = useMockData();

    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
    const [sales, setSales] = useState<SaleTransaction[]>(initialSales);
    const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);

    const addProduct = (newProduct: Omit<Product, 'id'>) => {
        const product = { ...newProduct, id: `prod-${Date.now()}` };
        setProducts(prev => [...prev, product ]);
        // Also add some initial inventory for the new product in the first store
        setInventory(prev => [...prev, { productId: product.id, storeId: stores[0].id, stock: Math.floor(Math.random() * 50) + 10}]);
    };
    
    const addCategory = (newCategory: Omit<Category, 'id'>) => {
        setCategories(prev => [...prev, { ...newCategory, id: `cat-${Date.now()}` }]);
    };

    const addSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
        setSuppliers(prev => [...prev, { ...newSupplier, id: `sup-${Date.now()}` }]);
    };

    const addStore = (newStore: Omit<Store, 'id'>) => {
        setStores(prev => [...prev, { ...newStore, id: `store-${Date.now()}` }]);
    };

    const addSale = (newSale: SaleTransaction) => {
        setSales(prev => [newSale, ...prev]);

        // Also update inventory
        let newInventory = [...inventory];
        newSale.items.forEach(item => {
            const inventoryIndex = newInventory.findIndex(i => i.productId === item.productId && i.storeId === newSale.storeId);
            if(inventoryIndex > -1) {
                newInventory[inventoryIndex].stock -= item.quantity;
            }
        });
        setInventory(newInventory);
    };

    const addPurchase = (newPurchase: PurchaseTransaction) => {
        setPurchases(prev => [newPurchase, ...prev]);

        let newInventory = [...inventory];
        newPurchase.items.forEach(item => {
            const inventoryIndex = newInventory.findIndex(i => i.productId === item.productId && i.storeId === newPurchase.storeId);
            if (inventoryIndex > -1) {
                newInventory[inventoryIndex].stock += item.quantity;
            } else {
                newInventory.push({
                    productId: item.productId,
                    storeId: newPurchase.storeId,
                    stock: item.quantity,
                });
            }
        });
        setInventory(newInventory);
    };

    const updateInventory = (newInventory: InventoryItem[]) => {
        setInventory(newInventory);
    }

    return (
        <DataContext.Provider value={{ 
            products, addProduct,
            categories, addCategory,
            suppliers, addSupplier,
            stores, addStore,
            inventory, updateInventory,
            sales, addSale,
            addPurchase
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
