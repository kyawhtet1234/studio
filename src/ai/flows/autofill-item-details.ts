
// src/ai/flows/autofill-item-details.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow that automatically fills item details (name and sell price)
 * based on the SKU entered on the sales page, for a specific user.
 *
 * @exports autofillItemDetails - The main function to trigger the flow.
 * @exports AutofillItemDetailsInput - The input type for the autofillItemDetails function.
 * @exports AutofillItemDetailsOutput - The output type for the autofillItemDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Product } from '@/lib/types';


const AutofillItemDetailsInputSchema = z.object({
  sku: z.string().describe('The Stock Keeping Unit (SKU) of the item.'),
  userId: z.string().describe('The ID of the user to fetch product data for.'),
});
export type AutofillItemDetailsInput = z.infer<typeof AutofillItemDetailsInputSchema>;

const AutofillItemDetailsOutputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  sellPrice: z.number().describe('The selling price of the item.'),
});
export type AutofillItemDetailsOutput = z.infer<typeof AutofillItemDetailsOutputSchema>;

export async function autofillItemDetails(input: AutofillItemDetailsInput): Promise<AutofillItemDetailsOutput> {
  return autofillItemDetailsFlow(input);
}

const autofillItemDetailsFlow = ai.defineFlow(
  {
    name: 'autofillItemDetailsFlow',
    inputSchema: AutofillItemDetailsInputSchema,
    outputSchema: AutofillItemDetailsOutputSchema,
  },
  async ({ sku, userId }) => {
    
    const productsRef = collection(db, 'users', userId, 'products');
    const q = query(productsRef, where('sku', '==', sku));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error('Product not found for the given SKU.');
    }

    const productDoc = querySnapshot.docs[0];
    const product = productDoc.data() as Product;

    return {
      itemName: product.name,
      sellPrice: product.sellPrice,
    };
  }
);
