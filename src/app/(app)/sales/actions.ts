
'use server';

import { z } from "zod";
import type { Product } from "@/lib/types";

const AutofillSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
});

type AutofillState = {
    message: string;
    data: {
        itemName: string;
        sellPrice: number;
    } | null;
}

export async function autofillAction(
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
        if (!productsStr) {
            throw new Error("Product data is missing.");
        }

        const products: Product[] = JSON.parse(productsStr as string);
        const { sku } = validatedFields.data;

        const product = products.find(p => p.sku === sku);
        if (!product) {
            throw new Error('Product not found for the given SKU.');
        }

        return {
            message: 'Success',
            data: {
                itemName: product.name,
                sellPrice: product.sellPrice,
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

    