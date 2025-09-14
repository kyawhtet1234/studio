
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
    purchases: PurchaseTransaction[];
    addProduct: (product: Omit<Product, 'id'>) => void;
    deleteProduct: (productId: string) => void;
    addCategory: (category: Omit<Category, 'id'>) => void;
    deleteCategory: (categoryId: string) => void;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
    deleteSupplier: (supplierId: string) => void;
    addStore: (store: Omit<Store, 'id'>) => void;
    deleteStore: (storeId: string) => void;
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
    }, [initialProducts, initialCategories, initialSuppliers, initialStores, initialInventory, initialSales]);

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
            // Initialize stock in all stores for the new product
            const newInventoryEntries = currentStores.map(store => ({
                 productId: product.id, storeId: store.id, stock: 0 
            }));
            setInventory(prev => [...prev, ...newInventoryEntries]);
        }
    };
    
    const deleteProduct = (productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
        setInventory(prev => prev.filter(i => i.productId !== productId));
    };

    const addCategory = (newCategory: Omit<Category, 'id'>) => {
        setCategories(prev => [...prev, { ...newCategory, id: `cat-${Date.now()}` }]);
    };

    const deleteCategory = (categoryId: string) => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    const addSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
        setSuppliers(prev => [...prev, { ...newSupplier, id: `sup-${Date.now()}` }]);
    };

    const deleteSupplier = (supplierId: string) => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    };

    const addStore = (newStore: Omit<Store, 'id'>) => {
        const store = { ...newStore, id: `store-${Date.now()}` };
        setStores(prev => [...prev, store]);
        // Initialize inventory for all existing products in the new store
        const newInventoryEntries = products.map(product => ({
            productId: product.id, storeId: store.id, stock: 0
        }));
        setInventory(prev => [...prev, ...newInventoryEntries]);
    };

    const deleteStore = (storeId: string) => {
        setStores(prev => prev.filter(s => s.id !== storeId));
        setInventory(prev => prev.filter(i => i.storeId !== storeId));
    };

    const addSale = (newSale: SaleTransaction) => {
        setSales(prev => [newSale, ...prev]);

        setInventory(prevInventory => {
            const newInventory = prevInventory.map(invItem => {
                const saleItem = newSale.items.find(
                    saleItm => saleItm.productId === invItem.productId && newSale.storeId === invItem.storeId
                );
                if (saleItem) {
                    return { ...invItem, stock: invItem.stock - saleItem.quantity };
                }
                return invItem;
            });
            return newInventory;
        });
    };

    const addPurchase = (newPurchase: PurchaseTransaction) => {
        setPurchases(prev => [newPurchase, ...prev]);

        setInventory(prevInventory => {
            const updatedInventory = [...prevInventory];
            newPurchase.items.forEach(item => {
                const inventoryIndex = updatedInventory.findIndex(
                    i => i.productId === item.productId && i.storeId === newPurchase.storeId
                );

                if (inventoryIndex > -1) {
                    updatedInventory[inventoryIndex] = {
                        ...updatedInventory[inventoryIndex],
                        stock: updatedInventory[inventoryIndex].stock + item.quantity,
                    };
                } else {
                    updatedInventory.push({
                        productId: item.productId,
                        storeId: newPurchase.storeId,
                        stock: item.quantity,
                    });
                }
            });
            return updatedInventory;
        });
    };

    const updateInventory = (newInventory: InventoryItem[]) => {
        setInventory(newInventory);
    }

    if (!isDataLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <DataContext.Provider value={{ 
            products, addProduct, deleteProduct,
            categories, addCategory, deleteCategory,
            suppliers, addSupplier, deleteSupplier,
            stores, addStore, deleteStore,
            inventory, updateInventory,
            sales, addSale,
            purchases,
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
