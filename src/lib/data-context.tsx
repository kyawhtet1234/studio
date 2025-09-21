
'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp, deleteDoc, addDoc, query, where, documentId, getDoc, updateDoc } from 'firebase/firestore';

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
    updateProduct: (productId: string, product: Partial<Omit<Product, 'id'>>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (categoryId: string, category: Partial<Omit<Category, 'id'>>) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    updateSupplier: (supplierId: string, supplier: Partial<Omit<Supplier, 'id'>>) => Promise<void>;
    deleteSupplier: (supplierId: string) => Promise<void>;
    addStore: (store: Omit<Store, 'id'>) => Promise<void>;
    updateStore: (storeId: string, store: Partial<Omit<Store, 'id'>>) => Promise<void>;
    deleteStore: (storeId: string) => Promise<void>;
    addSale: (sale: Omit<SaleTransaction, 'id' | 'date' | 'status'>) => Promise<void>;
    voidSale: (saleId: string) => Promise<void>;
    addPurchase: (purchase: Omit<PurchaseTransaction, 'id' | 'date'>) => Promise<void>;
    deletePurchase: (purchaseId: string) => Promise<void>;
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
            const fetchedProducts = productsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
            setProducts(fetchedProducts);

            const categoriesSnap = await getDocs(query(collection(db, 'users', uid, 'categories')));
            const fetchedCategories = categoriesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
            setCategories(fetchedCategories);

            const suppliersSnap = await getDocs(query(collection(db, 'users', uid, 'suppliers')));
            const fetchedSuppliers = suppliersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier));
            setSuppliers(fetchedSuppliers);

            const storesSnap = await getDocs(query(collection(db, 'users', uid, 'stores')));
            const fetchedStores = storesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Store));
            setStores(fetchedStores);

            const inventorySnap = await getDocs(query(collection(db, 'users', uid, 'inventory')));
            const fetchedInventory = inventorySnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryItem & {id: string}));
            setInventory(fetchedInventory);

            const salesSnap = await getDocs(query(collection(db, 'users', uid, 'sales')));
            setSales(salesSnap.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id, date: (data.date as Timestamp).toDate() } as SaleTransaction
            }));

            const purchasesSnap = await getDocs(query(collection(db, 'users', uid, 'purchases')));
            setPurchases(purchasesSnap.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id, date: (data.date as Timestamp).toDate() } as PurchaseTransaction
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
        await addDoc(collection(db, 'users', user.uid, 'products'), productData);
        await fetchData(user.uid);
    };

    const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id'>>) => {
        if (!user) return;
        const productRef = doc(db, 'users', user.uid, 'products', productId);
        await updateDoc(productRef, productData);
        await fetchData(user.uid);
    }

    const deleteProduct = async (productId: string) => {
        if (!user) return;
        
        const batch = writeBatch(db);
        
        const productRef = doc(db, 'users', user.uid, 'products', productId);
        batch.delete(productRef);

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

    const updateCategory = async (categoryId: string, categoryData: Partial<Omit<Category, 'id'>>) => {
        if (!user) return;
        const categoryRef = doc(db, 'users', user.uid, 'categories', categoryId);
        await updateDoc(categoryRef, categoryData);
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

    const updateSupplier = async (supplierId: string, supplierData: Partial<Omit<Supplier, 'id'>>) => {
        if (!user) return;
        const supplierRef = doc(db, 'users', user.uid, 'suppliers', supplierId);
        await updateDoc(supplierRef, supplierData);
        await fetchData(user.uid);
    };
    
    const deleteSupplier = async (supplierId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'suppliers', supplierId));
        await fetchData(user.uid);
    };

    const addStore = async (storeData: Omit<Store, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'stores'), storeData);
        await fetchData(user.uid);
    };

    const updateStore = async (storeId: string, storeData: Partial<Omit<Store, 'id'>>) => {
        if (!user) return;
        const storeRef = doc(db, 'users', user.uid, 'stores', storeId);
        await updateDoc(storeRef, storeData);
        await fetchData(user.uid);
    };
    
    const deleteStore = async (storeId: string) => {
        if (!user) return;

        const batch = writeBatch(db);

        const storeRef = doc(db, 'users', user.uid, 'stores', storeId);
        batch.delete(storeRef);
        
        const q = query(collection(db, 'users', user.uid, 'inventory'), where("storeId", "==", storeId));
        const inventoryToDeleteSnap = await getDocs(q);
        inventoryToDeleteSnap.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        await fetchData(user.uid);
    };

    const addSale = async (saleData: Omit<SaleTransaction, 'id' | 'date' | 'status'>) => {
        if (!user) return;
        
        const batch = writeBatch(db);
        const newSaleRef = doc(collection(db, 'users', user.uid, 'sales'));
        batch.set(newSaleRef, { 
            ...saleData, 
            date: Timestamp.now(),
            status: 'completed' 
        });

        const productIds = saleData.items.map(i => i.productId);
        if (productIds.length > 0) {
            const inventoryQuery = query(
                collection(db, 'users', user.uid, 'inventory'),
                where('storeId', '==', saleData.storeId),
                where('productId', 'in', productIds)
            );
            const inventorySnap = await getDocs(inventoryQuery);
            const inventoryMap = new Map(inventorySnap.docs.map(d => [d.data().productId, d]));
    
            for (const item of saleData.items) {
                const inventoryDoc = inventoryMap.get(item.productId);
                if (inventoryDoc) {
                    const currentStock = inventoryDoc.data().stock;
                    batch.update(inventoryDoc.ref, { stock: currentStock - item.quantity });
                }
            }
        }
        
        await batch.commit();
        await fetchData(user.uid);
    };

    const voidSale = async (saleId: string) => {
        if (!user) return;
        
        const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
        const saleSnap = await getDoc(saleRef);
        
        if (!saleSnap.exists() || saleSnap.data().status === 'voided') {
            console.error("Sale to void not found or already voided.");
            return;
        }

        const saleData = saleSnap.data() as SaleTransaction;
        const batch = writeBatch(db);

        const productIds = saleData.items.map(i => i.productId);
        if (productIds.length > 0) {
            const inventoryQuery = query(
                collection(db, 'users', user.uid, 'inventory'),
                where('storeId', '==', saleData.storeId),
                where('productId', 'in', productIds)
            );
            const inventorySnap = await getDocs(inventoryQuery);
            const inventoryMap = new Map(inventorySnap.docs.map(d => [d.data().productId, d]));
    
            for (const item of saleData.items) {
                const inventoryDoc = inventoryMap.get(item.productId);
                if (inventoryDoc) {
                    const currentStock = inventoryDoc.data().stock;
                    batch.update(inventoryDoc.ref, { stock: currentStock + item.quantity });
                }
            }
        }
        
        batch.update(saleRef, { status: 'voided' });
        
        await batch.commit();
        await fetchData(user.uid);
    };

    const addPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id' | 'date'>) => {
        if (!user) return;
    
        const batch = writeBatch(db);
        const newPurchaseRef = doc(collection(db, 'users', user.uid, 'purchases'));
        batch.set(newPurchaseRef, { ...purchaseData, date: Timestamp.now() });
    
        const productIds = purchaseData.items.map(item => item.productId);
        if (productIds.length > 0) {
            const inventoryQuery = query(
                collection(db, 'users', user.uid, 'inventory'),
                where('storeId', '==', purchaseData.storeId),
                where('productId', 'in', productIds)
            );
            const inventorySnap = await getDocs(inventoryQuery);
            const inventoryMap = new Map(inventorySnap.docs.map(d => [d.data().productId, { id: d.id, ref: d.ref, ...d.data() }]));
    
            for (const item of purchaseData.items) {
                const inventoryDoc = inventoryMap.get(item.productId);
                if (inventoryDoc) {
                    const currentStock = inventoryDoc.stock;
                    batch.update(inventoryDoc.ref, { stock: currentStock + item.quantity });
                } else {
                    const newInventoryRef = doc(collection(db, 'users', user.uid, 'inventory'));
                    batch.set(newInventoryRef, {
                        productId: item.productId,
                        storeId: purchaseData.storeId,
                        stock: item.quantity,
                    });
                }
            }
        }
    
        await batch.commit();
        await fetchData(user.uid);
    };
    
    const deletePurchase = async (purchaseId: string) => {
        if (!user) return;
    
        const purchaseRef = doc(db, 'users', user.uid, 'purchases', purchaseId);
        const purchaseSnap = await getDoc(purchaseRef);
    
        if (!purchaseSnap.exists()) {
            console.error("Purchase to delete not found");
            return;
        }
    
        const purchaseData = purchaseSnap.data() as Omit<PurchaseTransaction, 'id' | 'date'>;
        const batch = writeBatch(db);
        batch.delete(purchaseRef);
    
        const productIds = purchaseData.items.map(item => item.productId);
        if (productIds.length > 0) {
            const inventoryQuery = query(
                collection(db, 'users', user.uid, 'inventory'),
                where('storeId', '==', purchaseData.storeId),
                where('productId', 'in', productIds)
            );
            const inventorySnap = await getDocs(inventoryQuery);
            const inventoryMap = new Map(inventorySnap.docs.map(d => [d.data().productId, { ref: d.ref, ...d.data() }]));
    
            for (const item of purchaseData.items) {
                const inventoryDoc = inventoryMap.get(item.productId);
                if (inventoryDoc) {
                    const currentStock = inventoryDoc.stock;
                    const newStock = Math.max(0, currentStock - item.quantity);
                    batch.update(inventoryDoc.ref, { stock: newStock });
                }
            }
        }
    
        await batch.commit();
        await fetchData(user.uid);
    };

    const updateInventory = async (updatedItems: InventoryItem[]) => {
        if (!user) return;
        const batch = writeBatch(db);
        
        const productIds = updatedItems.map(item => item.productId);
        if (productIds.length === 0) {
            await fetchData(user.uid);
            return;
        }

        const inventoryQuery = query(collection(db, 'users', user.uid, 'inventory'), where('productId', 'in', productIds));
        const inventorySnap = await getDocs(inventoryQuery);

        for (const newItem of updatedItems) {
            const docToUpdate = inventorySnap.docs.find(doc => {
                const data = doc.data();
                return data.productId === newItem.productId && data.storeId === newItem.storeId;
            });
             if (docToUpdate) {
                batch.update(docToUpdate.ref, { stock: newItem.stock });
            } else {
                 const newInventoryRef = doc(collection(db, 'users', user.uid, 'inventory'));
                 batch.set(newInventoryRef, newItem);
            }
        }

        await batch.commit();
        await fetchData(user.uid);
    };

    return (
        <DataContext.Provider value={{ 
            products, addProduct, updateProduct, deleteProduct,
            categories, addCategory, updateCategory, deleteCategory,
            suppliers, addSupplier, updateSupplier, deleteSupplier,
            stores, addStore, updateStore, deleteStore,
            inventory, updateInventory,
            sales, addSale, voidSale,
            purchases, addPurchase, deletePurchase,
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

    