'use server';

import { autofillPurchaseDetails } from "@/ai/flows/autofill-purchase-details";
import { z } from "zod";

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

    try {
        const result = await autofillPurchaseDetails({ sku: validatedFields.data.sku });
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
