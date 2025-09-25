
'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp, deleteDoc, addDoc, query, where, documentId, getDoc, updateDoc, runTransaction, collectionGroup } from 'firebase/firestore';

import type { Product, Category, Supplier, Store, InventoryItem, SaleTransaction, PurchaseTransaction, Customer } from '@/lib/types';

interface DataContextProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    stores: Store[];
    customers: Customer[];
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
    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    updateCustomer: (customerId: string, customer: Partial<Omit<Customer, 'id'>>) => Promise<void>;
    deleteCustomer: (customerId: string) => Promise<void>;
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
    const [customers, setCustomers] = useState<Customer[]>([]);
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

            const customersSnap = await getDocs(query(collection(db, 'users', uid, 'customers')));
            const fetchedCustomers = customersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer));
            setCustomers(fetchedCustomers);

            const inventorySnap = await getDocs(query(collection(db, 'users', uid, 'inventory')));
            const fetchedInventory = inventorySnap.docs.map(doc => {
              const [productId, storeId] = doc.id.split('_');
              return { ...doc.data(), productId, storeId, id: doc.id } as InventoryItem
            });
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
            setCustomers([]);
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

    const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'customers'), customerData);
        await fetchData(user.uid);
    };

    const updateCustomer = async (customerId: string, customerData: Partial<Omit<Customer, 'id'>>) => {
        if (!user) return;
        const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
        await updateDoc(customerRef, customerData);
        await fetchData(user.uid);
    };
    
    const deleteCustomer = async (customerId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'customers', customerId));
        await fetchData(user.uid);
    };

    const addSale = async (saleData: Omit<SaleTransaction, 'id' | 'date' | 'status'>) => {
        if (!user) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                // ===== READS FIRST =====
                const inventoryRefs = saleData.items.map(item => {
                    const inventoryId = `${item.productId}_${saleData.storeId}`;
                    return doc(db, 'users', user.uid, 'inventory', inventoryId);
                });

                const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

                // ===== WRITES SECOND =====
                const newSaleRef = doc(collection(db, 'users', user.uid, 'sales'));
                transaction.set(newSaleRef, { 
                    ...saleData, 
                    date: Timestamp.now(),
                    status: 'completed' 
                });

                for (let i = 0; i < saleData.items.length; i++) {
                    const item = saleData.items[i];
                    const inventorySnap = inventorySnaps[i];

                    if (!inventorySnap.exists()) {
                        throw new Error(`Product ${item.name} is out of stock.`);
                    }

                    const currentStock = inventorySnap.data().stock || 0;
                    if (currentStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
                    }

                    const newStock = currentStock - item.quantity;
                    transaction.update(inventorySnap.ref, { stock: newStock });
                }
            });
        } catch (e) {
            console.error("Sale transaction failed: ", e);
            throw e;
        }

        await fetchData(user.uid);
    };

    const voidSale = async (saleId: string) => {
        if (!user) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                // ===== READS FIRST =====
                const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
                const saleSnap = await transaction.get(saleRef);
                
                if (!saleSnap.exists() || saleSnap.data().status === 'voided') {
                    throw new Error("Sale to void not found or already voided.");
                }

                const saleData = saleSnap.data() as SaleTransaction;
                
                const inventoryRefs = saleData.items.map(item => {
                    const inventoryId = `${item.productId}_${saleData.storeId}`;
                    return doc(db, 'users', user.uid, 'inventory', inventoryId);
                });

                const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

                // ===== WRITES SECOND =====
                transaction.update(saleRef, { status: 'voided' });

                for (let i = 0; i < saleData.items.length; i++) {
                    const item = saleData.items[i];
                    const inventorySnap = inventorySnaps[i];
                    const inventoryRef = inventoryRefs[i];

                    if (inventorySnap.exists()) {
                        const currentStock = inventorySnap.data().stock || 0;
                        transaction.update(inventoryRef, { stock: currentStock + item.quantity });
                    } else {
                        // If inventory record doesn't exist, create it.
                        transaction.set(inventoryRef, {
                            productId: item.productId,
                            storeId: saleData.storeId,
                            stock: item.quantity,
                        });
                    }
                }
            });
        } catch(e) {
            console.error("Void sale transaction failed: ", e);
            throw e;
        }
        
        await fetchData(user.uid);
    };

    const addPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id' | 'date'>) => {
        if (!user) return;
    
        try {
            await runTransaction(db, async (transaction) => {
                // ===== READS FIRST =====
                const inventoryRefs = purchaseData.items.map(item => {
                    const inventoryId = `${item.productId}_${purchaseData.storeId}`;
                    return doc(db, 'users', user.uid, 'inventory', inventoryId);
                });

                const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

                // ===== WRITES SECOND =====
                const newPurchaseRef = doc(collection(db, 'users', user.uid, 'purchases'));
                transaction.set(newPurchaseRef, { ...purchaseData, date: Timestamp.now() });

                for (let i = 0; i < purchaseData.items.length; i++) {
                    const item = purchaseData.items[i];
                    const inventorySnap = inventorySnaps[i];
                    const inventoryRef = inventoryRefs[i];

                    if (inventorySnap.exists()) {
                        const currentStock = inventorySnap.data().stock || 0;
                        const newStock = currentStock + item.quantity;
                        transaction.update(inventoryRef, { stock: newStock });
                    } else {
                        // Inventory record does not exist, so create it.
                        transaction.set(inventoryRef, {
                            productId: item.productId,
                            storeId: purchaseData.storeId,
                            stock: item.quantity,
                        });
                    }
                }
            });
        } catch (e) {
            console.error("Purchase transaction failed: ", e);
            throw e;
        }
    
        await fetchData(user.uid);
    };
    
    const deletePurchase = async (purchaseId: string) => {
        if (!user) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                // ===== READS FIRST =====
                const purchaseRef = doc(db, 'users', user.uid, 'purchases', purchaseId);
                const purchaseSnap = await transaction.get(purchaseRef);

                if (!purchaseSnap.exists()) {
                    throw new Error("Purchase to delete not found");
                }

                const purchaseData = purchaseSnap.data() as PurchaseTransaction;

                const inventoryRefs = purchaseData.items.map(item => {
                    const inventoryId = `${item.productId}_${purchaseData.storeId}`;
                    return doc(db, 'users', user.uid, 'inventory', inventoryId);
                });

                const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));
                // ===== WRITES SECOND =====
                transaction.delete(purchaseRef);
                
                for(let i = 0; i < purchaseData.items.length; i++) {
                    const item = purchaseData.items[i];
                    const inventorySnap = inventorySnaps[i];

                    if (inventorySnap.exists()) {
                        const currentStock = inventorySnap.data().stock || 0;
                        const newStock = Math.max(0, currentStock - item.quantity);
                        transaction.update(inventorySnap.ref, { stock: newStock });
                    }
                }
            });
        } catch (e) {
            console.error("Delete purchase transaction failed: ", e);
            throw e;
        }

        await fetchData(user.uid);
    };

    const updateInventory = async (updatedItems: InventoryItem[]) => {
        if (!user) return;
        const batch = writeBatch(db);

        for (const item of updatedItems) {
            const inventoryId = `${item.productId}_${item.storeId}`;
            const inventoryRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
            const docSnap = await getDoc(inventoryRef);

            if (docSnap.exists()) {
                 batch.update(inventoryRef, { stock: item.stock });
            } else {
                 batch.set(inventoryRef, { 
                     productId: item.productId, 
                     storeId: item.storeId, 
                     stock: item.stock 
                });
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
            customers, addCustomer, updateCustomer, deleteCustomer,
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
