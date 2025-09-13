
'use client';

import { useState } from 'react';
import { 
    productsData,
    categoriesData,
    suppliersData,
    storesData,
    inventoryData,
    generateSalesData
} from '@/lib/data';
import type { Product, Category, Supplier, Store, InventoryItem, SaleTransaction } from '@/lib/types';

interface MockData {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    stores: Store[];
    inventory: InventoryItem[];
    sales: SaleTransaction[];
}

export function useMockData(): MockData {
    const [mockData] = useState(() => {
        const stores = storesData;
        const products = productsData;
        const sales = generateSalesData(products, stores);

        return {
            products,
            categories: categoriesData,
            suppliers: suppliersData,
            stores,
            inventory: inventoryData,
            sales,
        };
    });

    return mockData;
}
