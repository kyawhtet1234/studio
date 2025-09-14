// src/ai/flows/autofill-item-details.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow that automatically fills item details (name and sell price)
 * based on the SKU entered on the sales page.
 *
 * @exports autofillItemDetails - The main function to trigger the flow.
 * @exports AutofillItemDetailsInput - The input type for the autofillItemDetails function.
 * @exports AutofillItemDetailsOutput - The output type for the autofillItemDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { productsData } from '@/lib/data';

const AutofillItemDetailsInputSchema = z.object({
  sku: z.string().describe('The Stock Keeping Unit (SKU) of the item.'),
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
  async ({ sku }) => {
    // In a real app, you'd fetch this from a database.
    // For the prototype, we use the static data files.
    // This is more robust than passing all data from the client.
    const product = productsData.find(p => p.sku === sku);
    
    if (!product) {
      throw new Error('Product not found for the given SKU.');
    }

    return {
      itemName: product.name,
      sellPrice: product.sellPrice,
    };
  }
);
