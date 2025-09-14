
'use server';
/**
 * @fileOverview This file defines a Genkit flow that automatically fills item details (name, supplier, and buy price)
 * based on the SKU entered on the purchase page.
 *
 * @exports autofillPurchaseDetails - The main function to trigger the flow.
 * @exports AutofillPurchaseDetailsInput - The input type for the autofillPurchaseDetails function.
 * @exports AutofillPurchaseDetailsOutput - The output type for the autofillPurchaseDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { productsData, suppliersData } from '@/lib/data';

const AutofillPurchaseDetailsInputSchema = z.object({
  sku: z.string().describe('The Stock Keeping Unit (SKU) of the item.'),
});
export type AutofillPurchaseDetailsInput = z.infer<typeof AutofillPurchaseDetailsInputSchema>;

const AutofillPurchaseDetailsOutputSchema = z.object({
  itemName: z.string().describe('The name of the item.'),
  supplierName: z.string().describe('The name of the supplier for the item.'),
  buyPrice: z.number().describe('The last known buying price of the item.'),
});
export type AutofillPurchaseDetailsOutput = z.infer<typeof AutofillPurchaseDetailsOutputSchema>;

export async function autofillPurchaseDetails(input: AutofillPurchaseDetailsInput): Promise<AutofillPurchaseDetailsOutput> {
  return autofillPurchaseDetailsFlow(input);
}

const autofillPurchaseDetailsFlow = ai.defineFlow(
  {
    name: 'autofillPurchaseDetailsFlow',
    inputSchema: AutofillPurchaseDetailsInputSchema,
    outputSchema: AutofillPurchaseDetailsOutputSchema,
  },
  async ({ sku }) => {
    // In a real app, you'd fetch this from a database.
    // For the prototype, we use the static data files.
    // This is more robust than passing all data from the client.
    const products = productsData;
    const suppliers = suppliersData;

    const product = products.find(p => p.sku === sku);
    if (!product) {
      // Try finding in localStorage if a real app was built this way
      // But for this prototype, we will assume productsData is the source of truth on the server
      throw new Error('Product not found for the given SKU.');
    }
    const supplier = suppliers.find(s => s.id === product.supplierId);
    if (!supplier) {
        throw new Error('Supplier not found for the given product.');
    }
    
    const output: AutofillPurchaseDetailsOutput = {
        itemName: product.name,
        supplierName: supplier.name,
        buyPrice: product.buyPrice
    }

    return output;
  }
);
