
'use server';

import { z } from "zod";
import type { Product, Supplier } from "@/lib/types";

const AutofillSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
});

type AutofillState = {
    message: string;
    data: {
        itemName: string;
        supplierName: string;
        buyPrice: number;
    } | null;
}

export async function autofillPurchaseAction(
    prevState: AutofillState, 
    formData: FormData
): Promise<AutofillState> {
    const validatedFields = AutofillSchema.safeParse({
        sku: formData.get('sku'),
    });

    if (!validatedFields.success) {
        return {
            ...prevState,
            message: 'Invalid SKU',
            data: null,
        };
    }

    try {
        const productsStr = formData.get('products');
        const suppliersStr = formData.get('suppliers');
        
        if (!productsStr || !suppliersStr) {
            throw new Error("Product and supplier data is missing.");
        }

        const products: Product[] = JSON.parse(productsStr as string);
        const suppliers: Supplier[] = JSON.parse(suppliersStr as string);
        const { sku } = validatedFields.data;

        const product = products.find(p => p.sku === sku);
        if (!product) {
            throw new Error('Product not found for the given SKU.');
        }

        const supplier = suppliers.find(s => s.id === product.supplierId);
        if (!supplier) {
            throw new Error('Supplier not found for the given product.');
        }

        return {
            message: 'Success',
            data: {
                itemName: product.name,
                supplierName: supplier.name,
                buyPrice: product.buyPrice,
            },
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
            ...prevState,
            message: `Failed to fetch item details: ${errorMessage}`,
            data: null,
        };
    }
}

    