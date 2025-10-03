
'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch, Timestamp, deleteDoc, addDoc, query, where, documentId, getDoc, updateDoc, runTransaction, collectionGroup, setDoc } from 'firebase/firestore';

import type { Product, Category, Supplier, Store, InventoryItem, SaleTransaction, PurchaseTransaction, Customer, Expense, ExpenseCategory, CashAccount, CashTransaction, CashAllocation, PaymentType, Liability, BusinessSettings, DocumentSettings } from '@/lib/types';

interface DataContextProps {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    stores: Store[];
    customers: Customer[];
    paymentTypes: PaymentType[];
    inventory: InventoryItem[];
    sales: SaleTransaction[];
    purchases: PurchaseTransaction[];
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
    cashAccounts: CashAccount[];
    cashTransactions: CashTransaction[];
    cashAllocations: CashAllocation[];
    liabilities: Liability[];
    settings: BusinessSettings;
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
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
    addPaymentType: (paymentType: Omit<PaymentType, 'id'>) => Promise<void>;
    updatePaymentType: (paymentTypeId: string, paymentType: Partial<Omit<PaymentType, 'id'>>) => Promise<void>;
    deletePaymentType: (paymentTypeId: string) => Promise<void>;
    addSale: (sale: Omit<SaleTransaction, 'id'>) => Promise<void>;
    updateSale: (saleId: string, sale: Partial<Omit<SaleTransaction, 'id'>>) => Promise<void>;
    voidSale: (saleId: string) => Promise<void>;
    deleteSale: (saleId: string) => Promise<void>;
    markInvoiceAsPaid: (saleId: string) => Promise<void>;
    recordPayment: (saleId: string, amount: number) => Promise<void>;
    addPurchase: (purchase: Omit<PurchaseTransaction, 'id'>) => Promise<void>;
    deletePurchase: (purchaseId: string) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    deleteExpense: (expenseId: string) => Promise<void>;
    addExpenseCategory: (category: Omit<ExpenseCategory, 'id'>) => Promise<void>;
    updateExpenseCategory: (categoryId: string, category: Partial<Omit<ExpenseCategory, 'id'>>) => Promise<void>;
    deleteExpenseCategory: (categoryId: string) => Promise<void>;
    addCashAccount: (account: Omit<CashAccount, 'id'>) => Promise<void>;
    deleteCashAccount: (accountId: string) => Promise<void>;
    addCashTransaction: (transaction: Omit<CashTransaction, 'id' | 'date'>) => Promise<void>;
    addCashAllocation: (allocation: Omit<CashAllocation, 'id'>) => Promise<void>;
    updateCashAllocation: (allocationId: string, allocation: Partial<Omit<CashAllocation, 'id'>>) => Promise<void>;
    deleteCashAllocation: (allocationId: string) => Promise<void>;
    addLiability: (liability: Omit<Liability, 'id'>) => Promise<void>;
    updateLiability: (liabilityId: string, liability: Partial<Omit<Liability, 'id'>>) => Promise<void>;
    deleteLiability: (liabilityId: string) => Promise<void>;
    updateInventory: (newInventory: InventoryItem[]) => Promise<void>;
    updateInvoiceSettings: (settings: DocumentSettings) => Promise<void>;
    updateQuotationSettings: (settings: DocumentSettings) => Promise<void>;
    updateReceiptSettings: (settings: { companyLogo?: string }) => Promise<void>;
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
    const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [sales, setSales] = useState<SaleTransaction[]>([]);
    const [purchases, setPurchases] = useState<PurchaseTransaction[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
    const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
    const [cashAllocations, setCashAllocations] = useState<CashAllocation[]>([]);
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [settings, setSettings] = useState<BusinessSettings>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            const collectionsToFetch = [
                { name: 'products', setter: setProducts, process: (doc: any) => ({ ...doc.data(), id: doc.id, createdAt: doc.data().createdAt ? (doc.data().createdAt as Timestamp).toDate() : new Date(0) }) },
                { name: 'categories', setter: setCategories },
                { name: 'expenseCategories', setter: setExpenseCategories },
                { name: 'suppliers', setter: setSuppliers },
                { name: 'stores', setter: setStores },
                { name: 'customers', setter: setCustomers },
                { name: 'paymentTypes', setter: setPaymentTypes },
                { name: 'inventory', setter: setInventory, process: (doc: any) => ({ ...doc.data(), id: doc.id, productId: doc.id.split('_')[0], storeId: doc.id.split('_')[1] }) },
                { name: 'sales', setter: setSales, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: (doc.data().date as Timestamp).toDate() }) },
                { name: 'purchases', setter: setPurchases, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: (doc.data().date as Timestamp).toDate() }) },
                { name: 'expenses', setter: setExpenses, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: (doc.data().date as Timestamp).toDate() }) },
                { name: 'cashAccounts', setter: setCashAccounts },
                { name: 'cashTransactions', setter: setCashTransactions, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: (doc.data().date as Timestamp).toDate() }) },
                { name: 'cashAllocations', setter: setCashAllocations },
                { name: 'liabilities', setter: setLiabilities },
            ];

            for (const { name, setter, process } of collectionsToFetch) {
                const snap = await getDocs(query(collection(db, 'users', uid, name)));
                const data = snap.docs.map(doc => process ? process(doc) : ({ ...doc.data(), id: doc.id }));
                setter(data as any);
            }
            
            const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'business'));
            if (settingsSnap.exists()) {
                setSettings(settingsSnap.data() as BusinessSettings);
            } else {
                setSettings({});
            }

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
            setPaymentTypes([]);
            setInventory([]);
            setSales([]);
            setPurchases([]);
            setExpenses([]);
            setExpenseCategories([]);
            setCashAccounts([]);
            setCashTransactions([]);
            setCashAllocations([]);
            setLiabilities([]);
            setSettings({});
            setLoading(false);
        }
    }, [user, fetchData]);

    const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
        if (!user) return;
        const newProductData = { ...productData, createdAt: Timestamp.now() };
        await addDoc(collection(db, 'users', user.uid, 'products'), newProductData);
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

    const addPaymentType = async (paymentTypeData: Omit<PaymentType, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'paymentTypes'), paymentTypeData);
        await fetchData(user.uid);
    };

    const updatePaymentType = async (paymentTypeId: string, paymentTypeData: Partial<Omit<PaymentType, 'id'>>) => {
        if (!user) return;
        const paymentTypeRef = doc(db, 'users', user.uid, 'paymentTypes', paymentTypeId);
        await updateDoc(paymentTypeRef, paymentTypeData);
        await fetchData(user.uid);
    };
    
    const deletePaymentType = async (paymentTypeId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'paymentTypes', paymentTypeId));
        await fetchData(user.uid);
    };

    const addSale = async (saleData: Omit<SaleTransaction, 'id'>) => {
        if (!user) return;
        
        const isInventoryDeducted = saleData.status === 'paid' || saleData.status === 'partially-paid' || saleData.status === 'completed';

        if (isInventoryDeducted) {
             try {
                await runTransaction(db, async (transaction) => {
                    const inventoryRefs = saleData.items.map(item => {
                        const inventoryId = `${item.productId}_${saleData.storeId}`;
                        return doc(db, 'users', user.uid, 'inventory', inventoryId);
                    });

                    const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

                    const newSaleRef = doc(collection(db, 'users', user.uid, 'sales'));
                    transaction.set(newSaleRef, { ...saleData, date: Timestamp.fromDate(saleData.date as Date) });

                    for (let i = 0; i < saleData.items.length; i++) {
                        const item = saleData.items[i];
                        const inventorySnap = inventorySnaps[i];

                        if (!inventorySnap.exists()) throw new Error(`Product ${item.name} is out of stock.`);
                        
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
        } else {
            // For invoices and quotations, just add the document without touching inventory.
            await addDoc(collection(db, 'users', user.uid, 'sales'), { ...saleData, date: Timestamp.fromDate(saleData.date as Date) });
        }

        await fetchData(user.uid);
    };
    
    const updateSale = async (saleId: string, saleData: Partial<Omit<SaleTransaction, 'id'>>) => {
        if (!user) return;
        const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
        await updateDoc(saleRef, { ...saleData, date: Timestamp.fromDate(saleData.date as Date) });
        await fetchData(user.uid);
    };
    
    const deleteSale = async (saleId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'sales', saleId));
        await fetchData(user.uid);
    };

    const markInvoiceAsPaid = async (saleId: string) => {
        if (!user) return;
        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
                const saleSnap = await transaction.get(saleRef);
                if (!saleSnap.exists()) throw new Error("Invoice not found");

                const saleData = saleSnap.data() as SaleTransaction;
                if(saleData.balance > 0) throw new Error("Cannot mark as paid. Balance is not zero.");

                const isAlreadyCompleted = saleData.status === 'completed' || saleData.status === 'paid';
                if(isAlreadyCompleted) return;


                // Deduct inventory
                for (const item of saleData.items) {
                    const invRef = doc(db, 'users', user.uid, 'inventory', `${item.productId}_${saleData.storeId}`);
                    const invSnap = await transaction.get(invRef);
                    if (!invSnap.exists()) throw new Error(`Inventory for ${item.name} not found.`);
                    
                    const currentStock = invSnap.data().stock || 0;
                    if (currentStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.name}.`);
                    }
                    const newStock = currentStock - item.quantity;
                    transaction.update(invRef, { stock: newStock });
                }

                // Update sale status
                transaction.update(saleRef, { status: 'paid' });
            });
        } catch (e) {
            console.error("Mark as paid transaction failed: ", e);
            throw e;
        }
        await fetchData(user.uid);
    };

    const recordPayment = async (saleId: string, amount: number) => {
        if(!user) return;
        const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
        try {
            await runTransaction(db, async (transaction) => {
                const saleSnap = await transaction.get(saleRef);
                if (!saleSnap.exists()) throw new Error("Invoice not found");
                const saleData = saleSnap.data() as SaleTransaction;
                const newPaidAmount = saleData.paidAmount + amount;
                const newBalance = saleData.total - newPaidAmount;
                const newStatus = newBalance <= 0 ? 'paid' : 'partially-paid';

                transaction.update(saleRef, {
                    paidAmount: newPaidAmount,
                    balance: newBalance,
                    status: newStatus
                });
            });
        } catch (e) {
            console.error("Record payment failed: ", e);
            throw e;
        }
        await fetchData(user.uid);
    };

    const voidSale = async (saleId: string) => {
        if (!user) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
                const saleSnap = await transaction.get(saleRef);
                
                if (!saleSnap.exists() || saleSnap.data().status === 'voided') {
                    throw new Error("Sale to void not found or already voided.");
                }

                const saleData = saleSnap.data() as SaleTransaction;
                
                // Only adjust inventory for sales that affected stock
                const inventoryAdjustingStatus: SaleTransaction['status'][] = ['completed', 'paid', 'partially-paid'];
                if (inventoryAdjustingStatus.includes(saleData.status)) {
                    const inventoryRefs = saleData.items.map(item => {
                        const inventoryId = `${item.productId}_${saleData.storeId}`;
                        return doc(db, 'users', user.uid, 'inventory', inventoryId);
                    });

                    const inventorySnaps = await Promise.all(inventoryRefs.map(ref => transaction.get(ref)));

                    for (let i = 0; i < saleData.items.length; i++) {
                        const item = saleData.items[i];
                        const inventorySnap = inventorySnaps[i];
                        const inventoryRef = inventoryRefs[i];

                        if (inventorySnap.exists()) {
                            const currentStock = inventorySnap.data().stock || 0;
                            transaction.update(inventoryRef, { stock: currentStock + item.quantity });
                        } else {
                            transaction.set(inventoryRef, {
                                productId: item.productId,
                                storeId: saleData.storeId,
                                stock: item.quantity,
                            });
                        }
                    }
                }
                
                transaction.update(saleRef, { status: 'voided', balance: saleData.total, paidAmount: 0 });
            });
        } catch(e) {
            console.error("Void sale transaction failed: ", e);
            throw e;
        }
        
        await fetchData(user.uid);
    };

    const addPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id'>) => {
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
                transaction.set(newPurchaseRef, { ...purchaseData, date: Timestamp.fromDate(purchaseData.date as Date) });

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

    const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
        if (!user) return;
        const expensePayload = {
            ...expenseData,
            date: Timestamp.fromDate(expenseData.date as Date)
        };
        await addDoc(collection(db, 'users', user.uid, 'expenses'), expensePayload);
        await fetchData(user.uid);
    };

    const deleteExpense = async (expenseId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'expenses', expenseId));
        await fetchData(user.uid);
    };

    const addExpenseCategory = async (categoryData: Omit<ExpenseCategory, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'expenseCategories'), categoryData);
        await fetchData(user.uid);
    };

    const updateExpenseCategory = async (categoryId: string, categoryData: Partial<Omit<ExpenseCategory, 'id'>>) => {
        if (!user) return;
        const categoryRef = doc(db, 'users', user.uid, 'expenseCategories', categoryId);
        await updateDoc(categoryRef, categoryData);
        await fetchData(user.uid);
    };

    const deleteExpenseCategory = async (categoryId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'expenseCategories', categoryId));
        await fetchData(user.uid);
    };

    const addCashAccount = async (account: Omit<CashAccount, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'cashAccounts'), account);
        await fetchData(user.uid);
    };

    const deleteCashAccount = async (accountId: string) => {
        if (!user) return;

        const batch = writeBatch(db);
        const accountRef = doc(db, 'users', user.uid, 'cashAccounts', accountId);
        batch.delete(accountRef);

        const q = query(collection(db, 'users', user.uid, 'cashTransactions'), where("accountId", "==", accountId));
        const transactionsSnap = await getDocs(q);
        transactionsSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        await fetchData(user.uid);
    };


    const addCashTransaction = async (tx: Omit<CashTransaction, 'id' | 'date'>) => {
        if (!user) return;
         try {
            await runTransaction(db, async (transaction) => {
                const accountRef = doc(db, 'users', user.uid, 'cashAccounts', tx.accountId);
                const accountSnap = await transaction.get(accountRef);

                if (!accountSnap.exists()) {
                    throw new Error("Cash account not found.");
                }

                const currentBalance = accountSnap.data().balance;
                let newBalance;

                if (tx.type === 'adjustment') {
                    newBalance = tx.amount;
                } else {
                    newBalance = tx.type === 'deposit' 
                        ? currentBalance + tx.amount 
                        : currentBalance - tx.amount;
                }

                transaction.update(accountRef, { balance: newBalance });

                const newTxRef = doc(collection(db, 'users', user.uid, 'cashTransactions'));
                transaction.set(newTxRef, { ...tx, date: Timestamp.now() });
            });
        } catch (e) {
            console.error("Cash transaction failed: ", e);
            throw e;
        }

        await fetchData(user.uid);
    };
    
    const addCashAllocation = async (allocation: Omit<CashAllocation, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'cashAllocations'), allocation);
        await fetchData(user.uid);
    };

    const updateCashAllocation = async (allocationId: string, allocation: Partial<Omit<CashAllocation, 'id'>>) => {
        if (!user) return;
        const allocationRef = doc(db, 'users', user.uid, 'cashAllocations', allocationId);
        await updateDoc(allocationRef, allocation);
        await fetchData(user.uid);
    };

    const deleteCashAllocation = async (allocationId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'cashAllocations', allocationId));
        await fetchData(user.uid);
    };

    const addLiability = async (liabilityData: Omit<Liability, 'id'>) => {
        if (!user) return;
        await addDoc(collection(db, 'users', user.uid, 'liabilities'), liabilityData);
        await fetchData(user.uid);
    };

    const updateLiability = async (liabilityId: string, liabilityData: Partial<Omit<Liability, 'id'>>) => {
        if (!user) return;
        const liabilityRef = doc(db, 'users', user.uid, 'liabilities', liabilityId);
        await updateDoc(liabilityRef, liabilityData);
        await fetchData(user.uid);
    };
    
    const deleteLiability = async (liabilityId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'liabilities', liabilityId));
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

    const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
        if (!user) return;
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'business');
        await setDoc(settingsRef, newSettings, { merge: true });
        await fetchData(user.uid);
    };

    const updateInvoiceSettings = async (invoiceSettings: DocumentSettings) => {
        await updateSettings({ invoice: invoiceSettings });
    };

    const updateQuotationSettings = async (quotationSettings: DocumentSettings) => {
        await updateSettings({ quotation: quotationSettings });
    };

    const updateReceiptSettings = async (receiptSettings: { companyLogo?: string }) => {
        await updateSettings({ receipt: receiptSettings });
    };

    return (
        <DataContext.Provider value={{ 
            products, addProduct, updateProduct, deleteProduct,
            categories, addCategory, updateCategory, deleteCategory,
            suppliers, addSupplier, updateSupplier, deleteSupplier,
            stores, addStore, updateStore, deleteStore,
            customers, addCustomer, updateCustomer, deleteCustomer,
            paymentTypes, addPaymentType, updatePaymentType, deletePaymentType,
            inventory, updateInventory,
            sales, addSale, updateSale, voidSale, deleteSale, markInvoiceAsPaid, recordPayment,
            purchases, addPurchase, deletePurchase,
            expenses, addExpense, deleteExpense,
            expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
            cashAccounts, addCashAccount, deleteCashAccount,
            cashTransactions, addCashTransaction,
            cashAllocations, addCashAllocation, updateCashAllocation, deleteCashAllocation,
            liabilities, addLiability, updateLiability, deleteLiability,
            settings,
            updateInvoiceSettings,
            updateQuotationSettings,
            updateReceiptSettings,
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
