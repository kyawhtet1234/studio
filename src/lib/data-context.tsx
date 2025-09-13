
'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [sales, setSales] = useState<SaleTransaction[]>([]);
    const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        const loadData = () => {
            const storedProducts = localStorage.getItem('products');
            const storedCategories = localStorage.getItem('categories');
            const storedSuppliers = localStorage.getItem('suppliers');
            const storedStores = localStorage.getItem('stores');
            const storedInventory = localStorage.getItem('inventory');
            const storedSales = localStorage.getItem('sales');
            const storedPurchases = localStorage.getItem('purchases');

            setProducts(storedProducts ? JSON.parse(storedProducts) : initialProducts);
            setCategories(storedCategories ? JSON.parse(storedCategories) : initialCategories);
            setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : initialSuppliers);
            setStores(storedStores ? JSON.parse(storedStores) : initialStores);
            setInventory(storedInventory ? JSON.parse(storedInventory) : initialInventory);
            setSales(storedSales ? JSON.parse(storedSales).map((s: SaleTransaction) => ({...s, date: new Date(s.date)})) : initialSales);
            setPurchases(storedPurchases ? JSON.parse(storedPurchases).map((p: PurchaseTransaction) => ({...p, date: new Date(p.date)})) : []);
            
            setIsDataLoaded(true);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (isDataLoaded) {
            localStorage.setItem('products', JSON.stringify(products));
            localStorage.setItem('categories', JSON.stringify(categories));
            localStorage.setItem('suppliers', JSON.stringify(suppliers));
            localStorage.setItem('stores', JSON.stringify(stores));
            localStorage.setItem('inventory', JSON.stringify(inventory));
            localStorage.setItem('sales', JSON.stringify(sales));
            localStorage.setItem('purchases', JSON.stringify(purchases));
        }
    }, [products, categories, suppliers, stores, inventory, sales, purchases, isDataLoaded]);

    const addProduct = (newProduct: Omit<Product, 'id'>) => {
        const product = { ...newProduct, id: `prod-${Date.now()}` };
        setProducts(prev => [...prev, product ]);
        const currentStores = stores.length > 0 ? stores : initialStores;
        if(currentStores.length > 0) {
            setInventory(prev => [...prev, { productId: product.id, storeId: currentStores[0].id, stock: Math.floor(Math.random() * 50) + 10}]);
        }
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

    if (!isDataLoaded) {
        return null; // Or a loading spinner
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
