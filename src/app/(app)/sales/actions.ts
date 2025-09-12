'use server';

import { autofillItemDetails } from "@/ai/flows/autofill-item-details";
import { z } from "zod";

const AutofillSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
});

export async function autofillAction(prevState: any, formData: FormData) {
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
        const result = await autofillItemDetails({ sku: validatedFields.data.sku });
        return {
            ...prevState,
            message: 'Success',
            data: result,
        };
    } catch (error) {
        console.error(error);
        return {
            ...prevState,
            message: 'Failed to fetch item details. Please enter manually.',
            data: null,
        };
    }
}
