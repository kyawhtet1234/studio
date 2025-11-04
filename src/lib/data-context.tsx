
'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFirebase } from '@/lib/client-provider';
import { collection, doc, getDocs, writeBatch, Timestamp, deleteDoc, addDoc, query, where, documentId, getDoc, updateDoc, runTransaction, collectionGroup, setDoc, Firestore } from 'firebase/firestore';

import type { Product, Category, Supplier, Store, InventoryItem, SaleTransaction, PurchaseTransaction, Customer, Expense, ExpenseCategory, CashAccount, CashTransaction, CashAllocation, PaymentType, Liability, BusinessSettings, DocumentSettings, Employee, SalaryAdvance, LeaveRecord, GoalsSettings, BrandingSettings } from '@/lib/types';
import { toDate } from './utils';

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
    employees: Employee[];
    salaryAdvances: SalaryAdvance[];
    leaveRecords: LeaveRecord[];
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
    addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (employeeId: string, employee: Partial<Omit<Employee, 'id'>>) => Promise<void>;
    deleteEmployee: (employeeId: string) => Promise<void>;
    addSalaryAdvance: (advance: Omit<SalaryAdvance, 'id'>) => Promise<void>;
    deleteSalaryAdvance: (advanceId: string) => Promise<void>;
    addLeaveRecord: (leave: Omit<LeaveRecord, 'id'>) => Promise<void>;
    deleteLeaveRecord: (leaveId: string) => Promise<void>;
    updateInventory: (updatedItems: InventoryItem[]) => Promise<void>;
    deleteInventoryItem: (itemId: string) => Promise<void>;
    updateInvoiceSettings: (settings: DocumentSettings) => Promise<void>;
    updateQuotationSettings: (settings: DocumentSettings) => Promise<void>;
    updateReceiptSettings: (settings: { companyLogo?: string }) => Promise<void>;
    updateGoalsSettings: (settings: GoalsSettings) => Promise<void>;
    updateBrandingSettings: (settings: BrandingSettings) => Promise<void>;
    loading: boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { db } = useFirebase();
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
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
    const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
    const [settings, setSettings] = useState<BusinessSettings>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (db: Firestore, uid: string) => {
        setLoading(true);
        try {
            const collectionsToFetch = [
                { name: 'products', setter: setProducts, process: (doc: any) => ({ ...doc.data(), id: doc.id, createdAt: doc.data().createdAt ? toDate(doc.data().createdAt) : new Date(0) }) },
                { name: 'categories', setter: setCategories },
                { name: 'expenseCategories', setter: setExpenseCategories },
                { name: 'suppliers', setter: setSuppliers },
                { name: 'stores', setter: setStores },
                { name: 'customers', setter: setCustomers },
                { name: 'paymentTypes', setter: setPaymentTypes },
                { name: 'inventory', setter: setInventory },
                { name: 'sales', setter: setSales, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: toDate(doc.data().date) }) },
                { name: 'purchases', setter: setPurchases, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: toDate(doc.data().date) }) },
                { name: 'expenses', setter: setExpenses, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: toDate(doc.data().date) }) },
                { name: 'cashAccounts', setter: setCashAccounts },
                { name: 'cashTransactions', setter: setCashTransactions, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: toDate(doc.data().date) }) },
                { name: 'cashAllocations', setter: setCashAllocations },
                { name: 'liabilities', setter: setLiabilities },
                { name: 'employees', setter: setEmployees },
                { name: 'salaryAdvances', setter: setSalaryAdvances, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: toDate(doc.data().date) }) },
                { name: 'leaveRecords', setter: setLeaveRecords, process: (doc: any) => ({ ...doc.data(), id: doc.id, date: toDate(doc.data().date) }) },
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
        if (user && db) {
            fetchData(db, user.uid);
        } else if (!user) {
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
            setEmployees([]);
            setSalaryAdvances([]);
            setLeaveRecords([]);
            setSettings({});
            setLoading(false);
        }
    }, [user, db, fetchData]);

    const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
        if (!user || !db) return;
        const batch = writeBatch(db);
        
        const newProductRef = doc(collection(db, 'users', user.uid, 'products'));
        const newProductData = { ...productData, createdAt: Timestamp.now() };
        batch.set(newProductRef, newProductData);
        const productId = newProductRef.id;

        const variants = productData.variant_track_enabled && productData.available_variants && productData.available_variants.length > 0 ? productData.available_variants : [""];

        for (const store of stores) {
            for (const variant of variants) {
                const variantName = variant || "";
                const inventoryId = `${productId}_${variantName}_${store.id}`;
                const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                batch.set(invRef, {
                    id: inventoryId,
                    productId: productId,
                    variant_name: variantName,
                    storeId: store.id,
                    stock: 0
                });
            }
        }
        await batch.commit();
        await fetchData(db, user.uid);
    };

    const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id'>>) => {
        if (!user || !db) return;
    
        await runTransaction(db, async (transaction) => {
            const productRef = doc(db, 'users', user.uid, 'products', productId);
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) {
                throw new Error("Product not found!");
            }
            const originalProductData = productSnap.data() as Product;
    
            // First, query for all inventory items related to this product to delete them.
            const inventoryQuery = query(collection(db, 'users', user.uid, 'inventory'), where('productId', '==', productId));
            const inventorySnaps = await getDocs(inventoryQuery); // This read is outside the transaction write phase which is fine.

            let baseStockToPreserve = 0;
            const hasVariantsPreviously = originalProductData.variant_track_enabled;

            inventorySnaps.forEach((invDoc) => {
                const invData = invDoc.data() as InventoryItem;
                // Preserve stock of the base item if we are DISABLING variants
                if (hasVariantsPreviously && !invData.variant_name) { 
                    baseStockToPreserve = invData.stock;
                }
                transaction.delete(invDoc.ref); // Delete all old inventory records
            });

            // Update the product document
            transaction.update(productRef, productData);
    
            // Recreate inventory records based on the new product data.
            const newVariants = (productData.variant_track_enabled && productData.available_variants && productData.available_variants.length > 0)
                ? productData.available_variants
                : [""];
    
            for (const store of stores) {
                for (const variant of newVariants) {
                    const variantName = variant || "";
                    const inventoryId = `${productId}_${variantName}_${store.id}`;
                    const newInvRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                    
                    let stockToSet = 0;
                    // If we are moving from variants to no-variants, restore the base stock
                    if (!productData.variant_track_enabled && !variantName) {
                        // This logic might need refinement if stock should be preserved per store.
                        // The current simple approach just preserves the first found base stock.
                        stockToSet = baseStockToPreserve;
                    }

                    transaction.set(newInvRef, {
                        id: inventoryId,
                        productId: productId,
                        variant_name: variantName,
                        storeId: store.id,
                        stock: stockToSet,
                    });
                }
            }
        });
    
        await fetchData(db, user.uid);
    };

    const deleteProduct = async (productId: string) => {
        if (!user || !db) return;
        const batch = writeBatch(db);
        const productRef = doc(db, 'users', user.uid, 'products', productId);
        batch.delete(productRef);

        const inventoryToDelete = inventory.filter(i => i.productId === productId);
        inventoryToDelete.forEach(item => {
            const inventoryId = `${item.productId}_${item.variant_name || ""}_${item.storeId}`;
            const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
            batch.delete(invRef);
        });
        
        await batch.commit();
        
        setProducts(prev => prev.filter(p => p.id !== productId));
        setInventory(prev => prev.filter(i => i.productId !== productId));
    };
    
    const addCategory = async (categoryData: Omit<Category, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'categories'), categoryData);
        setCategories(prev => [...prev, { ...categoryData, id: docRef.id }]);
    };

    const updateCategory = async (categoryId: string, categoryData: Partial<Omit<Category, 'id'>>) => {
        if (!user || !db) return;
        const categoryRef = doc(db, 'users', user.uid, 'categories', categoryId);
        await updateDoc(categoryRef, categoryData);
        setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...categoryData } : c));
    };
    
    const deleteCategory = async (categoryId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'categories', categoryId));
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'suppliers'), supplierData);
        setSuppliers(prev => [...prev, { ...supplierData, id: docRef.id }]);
    };

    const updateSupplier = async (supplierId: string, supplierData: Partial<Omit<Supplier, 'id'>>) => {
        if (!user || !db) return;
        const supplierRef = doc(db, 'users', user.uid, 'suppliers', supplierId);
        await updateDoc(supplierRef, supplierData);
        setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, ...supplierData } : s));
    };
    
    const deleteSupplier = async (supplierId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'suppliers', supplierId));
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    };

    const addStore = async (storeData: Omit<Store, 'id'>) => {
        if (!user || !db) return;
        const batch = writeBatch(db);
        
        const newStoreRef = doc(collection(db, 'users', user.uid, 'stores'));
        batch.set(newStoreRef, storeData);
        const storeId = newStoreRef.id;

        for (const product of products) {
            const variants = product.variant_track_enabled && product.available_variants ? product.available_variants : [""];
            for (const variant of variants) {
                const variantName = variant || "";
                const inventoryId = `${product.id}_${variantName}_${storeId}`;
                const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                batch.set(invRef, {
                    id: inventoryId,
                    productId: product.id,
                    variant_name: variantName,
                    storeId: storeId,
                    stock: 0
                });
            }
        }
        await batch.commit();
        await fetchData(db, user.uid);
    };

    const updateStore = async (storeId: string, storeData: Partial<Omit<Store, 'id'>>) => {
        if (!user || !db) return;
        const storeRef = doc(db, 'users', user.uid, 'stores', storeId);
        await updateDoc(storeRef, storeData);
        setStores(prev => prev.map(s => s.id === storeId ? { ...s, ...storeData } : s));
    };
    
    const deleteStore = async (storeId: string) => {
        if (!user || !db) return;
        const batch = writeBatch(db);
        const storeRef = doc(db, 'users', user.uid, 'stores', storeId);
        batch.delete(storeRef);
        
        const inventoryToDelete = inventory.filter(i => i.storeId === storeId);
        inventoryToDelete.forEach(item => {
            const inventoryId = `${item.productId}_${item.variant_name || ""}_${item.storeId}`;
            const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
            batch.delete(invRef);
        });
        
        await batch.commit();
        
        setStores(prev => prev.filter(s => s.id !== storeId));
        setInventory(prev => prev.filter(i => i.storeId !== storeId));
    };

    const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'customers'), customerData);
        setCustomers(prev => [...prev, { ...customerData, id: docRef.id }]);
    };

    const updateCustomer = async (customerId: string, customerData: Partial<Omit<Customer, 'id'>>) => {
        if (!user || !db) return;
        const customerRef = doc(db, 'users', user.uid, 'customers', customerId);
        await updateDoc(customerRef, customerData);
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...customerData } : c));
    };
    
    const deleteCustomer = async (customerId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'customers', customerId));
        setCustomers(prev => prev.filter(c => c.id !== customerId));
    };

    const addPaymentType = async (paymentTypeData: Omit<PaymentType, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'paymentTypes'), paymentTypeData);
        setPaymentTypes(prev => [...prev, { ...paymentTypeData, id: docRef.id }]);
    };

    const updatePaymentType = async (paymentTypeId: string, paymentTypeData: Partial<Omit<PaymentType, 'id'>>) => {
        if (!user || !db) return;
        const paymentTypeRef = doc(db, 'users', user.uid, 'paymentTypes', paymentTypeId);
        await updateDoc(paymentTypeRef, paymentTypeData);
        setPaymentTypes(prev => prev.map(pt => pt.id === paymentTypeId ? { ...pt, ...paymentTypeData } : pt));
    };
    
    const deletePaymentType = async (paymentTypeId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'paymentTypes', paymentTypeId));
        setPaymentTypes(prev => prev.filter(pt => pt.id !== paymentTypeId));
    };

    const addSale = async (saleData: Omit<SaleTransaction, 'id'>) => {
        if (!user || !db) return;
        const isInventoryDeducted = saleData.status === 'paid' || saleData.status === 'partially-paid' || saleData.status === 'completed';

        try {
            await runTransaction(db, async (transaction) => {
                const inventoryLookups = [];
                
                // --- READS FIRST ---
                if (isInventoryDeducted) {
                    for (const item of saleData.items) {
                        const variantName = item.variant_name || "";
                        const inventoryId = `${item.productId}_${variantName}_${saleData.storeId}`;
                        const inventoryRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                        inventoryLookups.push({ ref: inventoryRef, item });
                    }
                }
                const inventorySnaps = await Promise.all(inventoryLookups.map(lookup => transaction.get(lookup.ref)));

                // --- VALIDATION ---
                for (let i = 0; i < inventorySnaps.length; i++) {
                    const invSnap = inventorySnaps[i];
                    const { item } = inventoryLookups[i];
                    
                    if (!invSnap.exists()) {
                        throw new Error(`Product ${item.name} is out of stock.`);
                    }
                    const currentStock = invSnap.data().stock || 0;
                    if (currentStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
                    }
                }

                // --- WRITES SECOND ---
                const newSaleRef = doc(collection(db, 'users', user.uid, 'sales'));
                transaction.set(newSaleRef, { ...saleData, date: Timestamp.fromDate(toDate(saleData.date)) });

                if (isInventoryDeducted) {
                    for (let i = 0; i < inventorySnaps.length; i++) {
                        const invSnap = inventorySnaps[i];
                        const { ref, item } = inventoryLookups[i];
                        const currentStock = invSnap.data()!.stock;
                        const newStock = currentStock - item.quantity;
                        transaction.update(ref, { stock: newStock });
                    }
                }
            });
            await fetchData(db, user.uid);
        } catch (e) {
            console.error("Sale transaction failed: ", e);
            throw e;
        }
    };
    
    const updateSale = async (saleId: string, saleData: Partial<Omit<SaleTransaction, 'id'>>) => {
        if (!user || !db) return;
        const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
        const dataToUpdate: any = { ...saleData };
        if (saleData.date) {
            dataToUpdate.date = Timestamp.fromDate(toDate(saleData.date));
        }
        await updateDoc(saleRef, dataToUpdate);
        setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...saleData, date: toDate(saleData.date!) } as SaleTransaction : s));
    };
    
    const deleteSale = async (saleId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'sales', saleId));
        setSales(prev => prev.filter(s => s.id !== saleId));
    };

    const markInvoiceAsPaid = async (saleId: string) => {
        if (!user || !db) return;
        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
                const saleSnap = await transaction.get(saleRef);
                if (!saleSnap.exists()) throw new Error("Invoice not found");

                const saleData = saleSnap.data() as SaleTransaction;
                if(saleData.balance > 0) throw new Error("Cannot mark as paid. Balance is not zero.");
                if(saleData.status === 'completed' || saleData.status === 'paid') return;

                for (const item of saleData.items) {
                    const variantName = item.variant_name || "";
                    const inventoryId = `${item.productId}_${variantName}_${saleData.storeId}`;
                    const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                    const invSnap = await transaction.get(invRef);
                    if (!invSnap.exists()) throw new Error(`Inventory for ${item.name} not found.`);
                    
                    const currentStock = invSnap.data().stock || 0;
                    if (currentStock < item.quantity) throw new Error(`Not enough stock for ${item.name}.`);
                    
                    transaction.update(invRef, { stock: currentStock - item.quantity });
                }
                transaction.update(saleRef, { status: 'paid' });
            });
            await fetchData(db, user.uid);
        } catch (e) {
            console.error("Mark as paid transaction failed: ", e);
            throw e;
        }
    };

    const recordPayment = async (saleId: string, amount: number) => {
        if(!user || !db) return;
        const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
        try {
            await runTransaction(db, async (transaction) => {
                const saleSnap = await transaction.get(saleRef);
                if (!saleSnap.exists()) throw new Error("Invoice not found");
                const saleData = saleSnap.data() as SaleTransaction;
                const newPaidAmount = (saleData.paidAmount || 0) + amount;
                const newBalance = saleData.total - newPaidAmount;
                const newStatus = newBalance <= 0 ? 'paid' : 'partially-paid';

                transaction.update(saleRef, {
                    paidAmount: newPaidAmount,
                    balance: newBalance,
                    status: newStatus
                });
            });
            await fetchData(db, user.uid);
        } catch (e) {
            console.error("Record payment failed: ", e);
            throw e;
        }
    };

    const voidSale = async (saleId: string) => {
        if (!user || !db) return;
        try {
            await runTransaction(db, async (transaction) => {
                const saleRef = doc(db, 'users', user.uid, 'sales', saleId);
                const saleSnap = await transaction.get(saleRef);
                if (!saleSnap.exists() || saleSnap.data().status === 'voided') throw new Error("Sale not found or already voided.");

                const saleData = saleSnap.data() as SaleTransaction;
                
                const inventoryAdjustingStatus: SaleTransaction['status'][] = ['completed', 'paid', 'partially-paid'];
                if (inventoryAdjustingStatus.includes(saleData.status)) {
                    for (const item of saleData.items) {
                        const variantName = item.variant_name || "";
                        const inventoryId = `${item.productId}_${variantName}_${saleData.storeId}`;
                        const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                        const invSnap = await transaction.get(invRef);
                        if (invSnap.exists()) {
                            transaction.update(invRef, { stock: invSnap.data().stock + item.quantity });
                        } else {
                            transaction.set(invRef, { id: inventoryId, productId: item.productId, variant_name: variantName, storeId: saleData.storeId, stock: item.quantity });
                        }
                    }
                }
                
                transaction.update(saleRef, { status: 'voided', balance: saleData.total, paidAmount: 0 });
            });
            await fetchData(db, user.uid);
        } catch(e) {
            console.error("Void sale transaction failed: ", e);
            throw e;
        }
    };

    const addPurchase = async (purchaseData: Omit<PurchaseTransaction, 'id'>) => {
        if (!user || !db) return;
    
        try {
            await runTransaction(db, async (transaction) => {
                
                // --- Step 1: Read all necessary data first ---
                const itemRefsAndData = purchaseData.items.map(item => {
                    const variantName = item.variant_name || "";
                    const inventoryId = `${item.productId}_${variantName}_${purchaseData.storeId}`;
                    const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                    const productRef = doc(db, 'users', user.uid, 'products', item.productId);
                    return { item, invRef, productRef };
                });
    
                const docSnaps = await Promise.all(
                    itemRefsAndData.map(({ invRef, productRef }) => 
                        Promise.all([transaction.get(invRef), transaction.get(productRef)])
                    )
                );
    
                // --- Step 2: Perform all writes ---
                const newPurchaseRef = doc(collection(db, 'users', user.uid, 'purchases'));
                transaction.set(newPurchaseRef, { ...purchaseData, date: Timestamp.fromDate(toDate(purchaseData.date)) });
    
                for (let i = 0; i < itemRefsAndData.length; i++) {
                    const { item, invRef, productRef } = itemRefsAndData[i];
                    const [invSnap, productSnap] = docSnaps[i];
    
                    // Update inventory
                    const currentStock = invSnap.exists() ? invSnap.data().stock : 0;
                    const newStock = currentStock + item.quantity;
                    transaction.set(invRef, {
                        id: invRef.id,
                        productId: item.productId,
                        variant_name: item.variant_name || "",
                        storeId: purchaseData.storeId,
                        stock: newStock
                    }, { merge: true });
    
                    // Update product buy price if it has changed
                    if (productSnap.exists() && productSnap.data().buyPrice !== item.buyPrice) {
                        transaction.update(productRef, { buyPrice: item.buyPrice });
                    }
                }
            });
            await fetchData(db, user.uid);
        } catch (e) {
            console.error("Purchase transaction failed: ", e);
            throw e;
        }
    };
    
    const deletePurchase = async (purchaseId: string) => {
        if (!user || !db) return;
        try {
            const purchaseToDelete = purchases.find(p => p.id === purchaseId);
            if (!purchaseToDelete) throw new Error("Purchase not found");

            await runTransaction(db, async (transaction) => {
                const purchaseRef = doc(db, 'users', user.uid, 'purchases', purchaseId);
                transaction.delete(purchaseRef);
                
                for(const item of purchaseToDelete.items) {
                    const variantName = item.variant_name || "";
                    const inventoryId = `${item.productId}_${variantName}_${purchaseToDelete.storeId}`;
                    const invRef = doc(db, 'users', user.uid, 'inventory', inventoryId);
                    const invSnap = await transaction.get(invRef);
                    if (invSnap.exists()) {
                        transaction.update(invRef, { stock: Math.max(0, invSnap.data().stock - item.quantity) });
                    }
                }
            });
            await fetchData(db, user.uid);
        } catch (e) {
            console.error("Delete purchase transaction failed: ", e);
            throw e;
        }
    };

    const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
        if (!user || !db) return;
        const expensePayload = { ...expenseData, date: Timestamp.fromDate(toDate(expenseData.date)) };
        const docRef = await addDoc(collection(db, 'users', user.uid, 'expenses'), expensePayload);
        setExpenses(prev => [...prev, { ...expenseData, id: docRef.id, date: toDate(expenseData.date) }]);
    };

    const deleteExpense = async (expenseId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'expenses', expenseId));
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };

    const addExpenseCategory = async (categoryData: Omit<ExpenseCategory, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'expenseCategories'), categoryData);
        setExpenseCategories(prev => [...prev, { ...categoryData, id: docRef.id }]);
    };

    const updateExpenseCategory = async (categoryId: string, categoryData: Partial<Omit<ExpenseCategory, 'id'>>) => {
        if (!user || !db) return;
        const categoryRef = doc(db, 'users', user.uid, 'expenseCategories', categoryId);
        await updateDoc(categoryRef, categoryData);
        setExpenseCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...categoryData } : c));
    };

    const deleteExpenseCategory = async (categoryId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'expenseCategories', categoryId));
        setExpenseCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    const addCashAccount = async (account: Omit<CashAccount, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'cashAccounts'), account);
        setCashAccounts(prev => [...prev, { ...account, id: docRef.id }]);
    };

    const deleteCashAccount = async (accountId: string) => {
        if (!user || !db) return;
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', user.uid, 'cashAccounts', accountId));
        const q = query(collection(db, 'users', user.uid, 'cashTransactions'), where("accountId", "==", accountId));
        const transactionsSnap = await getDocs(q);
        transactionsSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        setCashAccounts(prev => prev.filter(a => a.id !== accountId));
        setCashTransactions(prev => prev.filter(t => t.accountId !== accountId));
    };


    const addCashTransaction = async (tx: Omit<CashTransaction, 'id' | 'date'>) => {
        if (!user || !db) return;
         try {
            await runTransaction(db, async (transaction) => {
                const accountRef = doc(db, 'users', user.uid, 'cashAccounts', tx.accountId);
                const accountSnap = await transaction.get(accountRef);
                if (!accountSnap.exists()) throw new Error("Cash account not found.");

                const currentBalance = accountSnap.data().balance;
                const newBalance = tx.type === 'adjustment' ? tx.amount : tx.type === 'deposit' ? currentBalance + tx.amount : currentBalance - tx.amount;
                
                transaction.update(accountRef, { balance: newBalance });

                const newTxRef = doc(collection(db, 'users', user.uid, 'cashTransactions'));
                transaction.set(newTxRef, { ...tx, date: Timestamp.now() });
            });
            await fetchData(db, user.uid);
        } catch (e) {
            console.error("Cash transaction failed: ", e);
            throw e;
        }
    };
    
    const addCashAllocation = async (allocation: Omit<CashAllocation, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'cashAllocations'), allocation);
        setCashAllocations(prev => [...prev, { ...allocation, id: docRef.id }]);
    };

    const updateCashAllocation = async (allocationId: string, allocation: Partial<Omit<CashAllocation, 'id'>>) => {
        if (!user || !db) return;
        const allocationRef = doc(db, 'users', user.uid, 'cashAllocations', allocationId);
        await updateDoc(allocationRef, allocation);
        setCashAllocations(prev => prev.map(a => a.id === allocationId ? { ...a, ...allocation } : a));
    };

    const deleteCashAllocation = async (allocationId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'cashAllocations', allocationId));
        setCashAllocations(prev => prev.filter(a => a.id !== allocationId));
    };

    const addLiability = async (liabilityData: Omit<Liability, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'liabilities'), liabilityData);
        setLiabilities(prev => [...prev, { ...liabilityData, id: docRef.id }]);
    };

    const updateLiability = async (liabilityId: string, liabilityData: Partial<Omit<Liability, 'id'>>) => {
        if (!user || !db) return;
        const liabilityRef = doc(db, 'users', user.uid, 'liabilities', liabilityId);
        await updateDoc(liabilityRef, liabilityData);
        setLiabilities(prev => prev.map(l => l.id === liabilityId ? { ...l, ...liabilityData } : l));
    };
    
    const deleteLiability = async (liabilityId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'liabilities', liabilityId));
        setLiabilities(prev => prev.filter(l => l.id !== liabilityId));
    };

    const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'employees'), employeeData);
        setEmployees(prev => [...prev, { ...employeeData, id: docRef.id }]);
    };
    
    const updateEmployee = async (employeeId: string, employeeData: Partial<Omit<Employee, 'id'>>) => {
        if (!user || !db) return;
        const employeeRef = doc(db, 'users', user.uid, 'employees', employeeId);
        await updateDoc(employeeRef, employeeData);
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, ...employeeData } : e));
    };
    
    const deleteEmployee = async (employeeId: string) => {
        if (!user || !db) return;
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', user.uid, 'employees', employeeId));
        
        const advancesQuery = query(collection(db, 'users', user.uid, 'salaryAdvances'), where('employeeId', '==', employeeId));
        const advancesSnap = await getDocs(advancesQuery);
        advancesSnap.forEach(doc => batch.delete(doc.ref));
        
        const leavesQuery = query(collection(db, 'users', user.uid, 'leaveRecords'), where('employeeId', '==', employeeId));
        const leavesSnap = await getDocs(leavesQuery);
        leavesSnap.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        setEmployees(prev => prev.filter(e => e.id !== employeeId));
        setSalaryAdvances(prev => prev.filter(sa => sa.employeeId !== employeeId));
        setLeaveRecords(prev => prev.filter(lr => lr.employeeId !== employeeId));
    };
    
    const addSalaryAdvance = async (advanceData: Omit<SalaryAdvance, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'salaryAdvances'), {
            ...advanceData,
            date: Timestamp.fromDate(toDate(advanceData.date))
        });
        setSalaryAdvances(prev => [...prev, { ...advanceData, id: docRef.id, date: toDate(advanceData.date) }]);
    };
    
    const deleteSalaryAdvance = async (advanceId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'salaryAdvances', advanceId));
        setSalaryAdvances(prev => prev.filter(sa => sa.id !== advanceId));
    };
    
    const addLeaveRecord = async (leaveData: Omit<LeaveRecord, 'id'>) => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, 'users', user.uid, 'leaveRecords'), {
            ...leaveData,
            date: Timestamp.fromDate(toDate(leaveData.date))
        });
        setLeaveRecords(prev => [...prev, { ...leaveData, id: docRef.id, date: toDate(leaveData.date) }]);
    };
    
    const deleteLeaveRecord = async (leaveId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'leaveRecords', leaveId));
        setLeaveRecords(prev => prev.filter(lr => lr.id !== leaveId));
    };

    const updateInventory = async (updatedItems: InventoryItem[]) => {
        if (!user || !db) return;
        const batch = writeBatch(db);

        updatedItems.forEach(item => {
            const invRef = doc(db, 'users', user.uid, 'inventory', item.id);
            batch.set(invRef, item, { merge: true });
        });

        await batch.commit();
        await fetchData(db, user.uid);
    };

    const deleteInventoryItem = async (itemId: string) => {
        if (!user || !db) return;
        await deleteDoc(doc(db, 'users', user.uid, 'inventory', itemId));
        setInventory(prev => prev.filter(i => i.id !== itemId));
    };

    const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
        if (!user || !db) return;
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'business');
        await setDoc(settingsRef, newSettings, { merge: true });
        setSettings(prev => ({...prev, ...newSettings}));
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

    const updateGoalsSettings = async (goalsSettings: GoalsSettings) => {
        await updateSettings({ goals: goalsSettings });
    };

    const updateBrandingSettings = async (brandingSettings: BrandingSettings) => {
        await updateSettings({ branding: brandingSettings });
    };

    return (
        <DataContext.Provider value={{ 
            products, addProduct, updateProduct, deleteProduct,
            categories, addCategory, updateCategory, deleteCategory,
            suppliers, addSupplier, updateSupplier, deleteSupplier,
            stores, addStore, updateStore, deleteStore,
            customers, addCustomer, updateCustomer, deleteCustomer,
            paymentTypes, addPaymentType, updatePaymentType, deletePaymentType,
            inventory, updateInventory, deleteInventoryItem,
            sales, addSale, updateSale, voidSale, deleteSale, markInvoiceAsPaid, recordPayment,
            purchases, addPurchase, deletePurchase,
            expenses, addExpense, deleteExpense,
            expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
            cashAccounts, addCashAccount, deleteCashAccount,
            cashTransactions, addCashTransaction,
            cashAllocations, addCashAllocation, updateCashAllocation, deleteCashAllocation,
            liabilities, addLiability, updateLiability, deleteLiability,
            employees, addEmployee, updateEmployee, deleteEmployee,
            salaryAdvances, addSalaryAdvance, deleteSalaryAdvance,
            leaveRecords, addLeaveRecord, deleteLeaveRecord,
            settings,
            updateInvoiceSettings,
            updateQuotationSettings,
            updateReceiptSettings,
            updateGoalsSettings,
            updateBrandingSettings,
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

    