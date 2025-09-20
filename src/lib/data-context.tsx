
'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp, deleteDoc, addDoc, query, where, documentId } from 'firebase/firestore';

import type { Product, Category, Supplier, Store, InventoryItem, SaleTransaction, PurchaseTransaction } from '@/lib/types';

interface DataContextProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    stores: Store[];
    inventory: InventoryItem[];
    sales: SaleTransaction[];
    purchases: PurchaseTransaction[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    deleteSupplier: (supplierId: string) => Promise<void>;
    addStore: (store: Omit<Store, 'id'>) => Promise<void>;
    deleteStore: (storeId: string) => Promise<void>;
    addSale: (sale: Omit<SaleTransaction, 'id' | 'date'>) => Promise<void>;
    addPurchase: (purchase: Omit<PurchaseTransaction, 'id' | 'date'>) => Promise<void>;
    updateInventory: (newInventory: InventoryItem[]) => Promise<void>;
    loading: boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [sales, setSales] = useState<SaleTransaction[]>([]);
    const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            const productsSnap = await getDocs(query(collection(db, 'users', uid, 'products')));
            const fetchedProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(fetchedProducts);

            const categoriesSnap = await getDocs(query(collection(db, 'users', uid, 'categories')));
            const fetchedCategories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(fetchedCategories);

            const suppliersSnap = await getDocs(query(collection(db, 'users', uid, 'suppliers')));
            const fetchedSuppliers = suppliersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
            setSuppliers(fetchedSuppliers);

            const storesSnap = await getDocs(query(collection(db, 'users', uid, 'stores')));
            const fetchedStores = storesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
            setStores(fetchedStores);

            const inventorySnap = await getDocs(query(collection(db, 'users', uid, 'inventory')));
            const fetchedInventory = inventorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem & {id: string}));
            setInventory(fetchedInventory);

            const salesSnap = await getDocs(query(collection(db, 'users', uid, 'sales')));
            setSales(salesSnap.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as SaleTransaction
            }));

            const purchasesSnap = await getDocs(query(collection(db, 'users', uid, 'purchases')));
            setPurchases(purchasesSnap.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as PurchaseTransaction
            }));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchData(user.uid);
        } else {
            // If there's no user, clear all data and stop loading
            setProducts([]);
            setCategories([]);
            setSuppliers([]);
            setStores([]);
            setInventory([]);
            setSales([]);
            setPurchases([]);
            setLoading(false);
        }
    }, [user, fetchData]);

    const addProduct = async (productData: Omit<Product, 'id'>) => {
        if (!user) return;
        const newProductRef = doc(collection(db, 'users', user.uid, 'products'));
        const newProduct = { ...productData };
        
        const batch = writeBatch(db);
        batch.set(newProductRef, newProduct);

        const currentStores = (await getDocs(query(collection(db, 'users', user.uid, 'stores')))).docs;

        // Initialize inventory for this product in all stores
        currentStores.forEach(storeDoc => {
            const inventoryRef = doc(collection(db, 'users', user.uid, 'inventory'));
            batch.set(inventoryRef, { productId: newProductRef.id, storeId: storeDoc.id, stock: 0 });
        });
        
        await batch.commit();
        await fetchData(user.uid); // Refresh all data
    };

    const deleteProduct = async (productId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'products', productId));
        
        const batch = writeBatch(db);
        const q = query(collection(db, 'users', user.uid, 'inventory'), where("productId", "==", productId));
        const inventoryToDeleteSnap = await getDocs(q);
        inventoryToDeleteSnap.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        await fetchData(user.uid);
    };
    
    const addCategory = async (categoryData: Omit<Category, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'categories'), categoryData);
        await fetchData(user.uid);
    };
    
    const deleteCategory = async (categoryId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'categories', categoryId));
        await fetchData(user.uid);
    };

    const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'suppliers'), supplierData);
        await fetchData(user.uid);
    };
    
    const deleteSupplier = async (supplierId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'suppliers', supplierId));
        await fetchData(user.uid);
    };

    const addStore = async (storeData: Omit<Store, 'id'>) => {
        if (!user) return;
        const newStoreRef = doc(collection(db, 'users', user.uid, 'stores'));
        
        const batch = writeBatch(db);
        batch.set(newStoreRef, storeData);
        
        const currentProducts = (await getDocs(query(collection(db, 'users', user.uid, 'products')))).docs;

        // Initialize inventory for all products in the new store
        currentProducts.forEach(productDoc => {
            const inventoryRef = doc(collection(db, 'users', user.uid, 'inventory'));
            batch.set(inventoryRef, { productId: productDoc.id, storeId: newStoreRef.id, stock: 0 });
        });
        
        await batch.commit();
        await fetchData(user.uid);
    };
    
    const deleteStore = async (storeId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'stores', storeId));

        const batch = writeBatch(db);
        const q = query(collection(db, 'users', user.uid, 'inventory'), where("storeId", "==", storeId));
        const inventoryToDeleteSnap = await getDocs(q);
        inventoryToDeleteSnap.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        await fetchData(user.uid);
    };

    const addSale = async (saleData: Omit<SaleTransaction, 'id' | 'date'>) => {
        if (!user) return;
        const newSale = { ...saleData, date: Timestamp.now() };
        await addDoc(collection(db, 'users', user.uid, 'sales'), newSale);

        const batch = writeBatch(db);
        const inventoryQuery = query(
            collection(db, 'users', user.uid, 'inventory'),
            where('storeId', '==', saleData.storeId)
        );
        const inventorySnap = await getDocs(inventoryQuery);
        const inventoryDocs = inventorySnap.docs;

        for (const item of saleData.items) {
            const inventoryDoc = inventoryDocs.find(d => d.data().productId === item.productId);
            if (inventoryDoc) {
                const currentStock = inventoryDoc.data().stock;
                batch.update(inventoryDoc.ref, { stock: currentStock - item.quantity });
            }
        }
        
        await batch.commit();
        await fetchData(user.uid);
    };

    const addPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id'| 'date'>) => {
        if (!user) return;
        const newPurchase = { ...purchaseData, date: Timestamp.now() };
        await addDoc(collection(db, 'users', user.uid, 'purchases'), newPurchase);

        const batch = writeBatch(db);
        const inventoryQuery = query(
            collection(db, 'users', user.uid, 'inventory'),
            where('storeId', '==', purchaseData.storeId)
        );
        const inventorySnap = await getDocs(inventoryQuery);
        const inventoryDocs = inventorySnap.docs;
        
        for (const item of purchaseData.items) {
            const inventoryDoc = inventoryDocs.find(d => d.data().productId === item.productId);

            if (inventoryDoc) {
                const currentStock = inventoryDoc.data().stock;
                batch.update(inventoryDoc.ref, { stock: currentStock + item.quantity });
            } else {
                // If inventory item does not exist for this store, create it
                const newInventoryRef = doc(collection(db, 'users', user.uid, 'inventory'));
                batch.set(newInventoryRef, {
                    productId: item.productId,
                    storeId: purchaseData.storeId,
                    stock: item.quantity
                });
            }
        }
        
        await batch.commit();
        await fetchData(user.uid);
    };

    const updateInventory = async (updatedItems: InventoryItem[]) => {
        if (!user) return;
        const batch = writeBatch(db);
        
        const itemIds = updatedItems.map(item => item.productId);
        if (itemIds.length === 0) {
            await fetchData(user.uid);
            return;
        }

        const inventoryQuery = query(collection(db, 'users', user.uid, 'inventory'), where('productId', 'in', itemIds));
        const inventorySnap = await getDocs(inventoryQuery);

        updatedItems.forEach(newItem => {
            const docToUpdate = inventorySnap.docs.find(doc => {
                const data = doc.data();
                return data.productId === newItem.productId && data.storeId === newItem.storeId;
            });
            if (docToUpdate) {
                batch.update(docToUpdate.ref, { stock: newItem.stock });
            }
        });

        await batch.commit();
        await fetchData(user.uid);
    };

    return (
        <DataContext.Provider value={{ 
            products, addProduct, deleteProduct,
            categories, addCategory, deleteCategory,
            suppliers, addSupplier, deleteSupplier,
            stores, addStore, deleteStore,
            inventory, updateInventory,
            sales, addSale,
            purchases, addPurchase,
            loading
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
