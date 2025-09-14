
'use server';

import { autofillPurchaseDetails } from "@/ai/flows/autofill-purchase-details";
import { z } from "zod";
// We no longer need to pass data from the client.
// import type { Product, Supplier } from "@/lib/types";

const AutofillSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
});

export async function autofillPurchaseAction(prevState: any, formData: FormData) {
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
    
    // The products and suppliers will now be read from the data file directly in the flow.
    // This is a more robust approach.

    try {
        const result = await autofillPurchaseDetails({ 
            sku: validatedFields.data.sku,
        });
        return {
            ...prevState,
            message: 'Success',
            data: result,
        };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
            ...prevState,
            message: `Failed to fetch item details: ${errorMessage}`,
            data: null,
        };
    }
}
