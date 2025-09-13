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

const prompt = ai.definePrompt({
  name: 'autofillPurchaseDetailsPrompt',
  input: {schema: AutofillPurchaseDetailsInputSchema},
  output: {schema: AutofillPurchaseDetailsOutputSchema},
  prompt: `You are a helpful assistant that retrieves item details for a purchase order based on the provided SKU.
  You have access to a list of products and suppliers.

  Product Data: ${JSON.stringify(productsData)}
  Supplier Data: ${JSON.stringify(suppliersData)}

  Given the following SKU, please provide the item name, the supplier's name, and the buy price.

  SKU: {{{sku}}}

  Please respond with the item name, supplier name, and buy price in JSON format.
  Make sure the buyPrice is a number.
  Example:
  {
    "itemName": "Example Item Name",
    "supplierName": "Example Supplier",
    "buyPrice": 9.99
  }`,
});

const autofillPurchaseDetailsFlow = ai.defineFlow(
  {
    name: 'autofillPurchaseDetailsFlow',
    inputSchema: AutofillPurchaseDetailsInputSchema,
    outputSchema: AutofillPurchaseDetailsOutputSchema,
  },
  async input => {
    // In a real app, you'd fetch this from a database.
    const product = productsData.find(p => p.sku === input.sku);
    if (!product) {
      throw new Error('Product not found for the given SKU.');
    }
    const supplier = suppliersData.find(s => s.id === product.supplierId);
    if (!supplier) {
        throw new Error('Supplier not found for the given product.');
    }
    
    // For this prototype, we'll just return the mock data directly.
    // In a real scenario, you might still use an LLM for more complex matching or data augmentation.
    const mockOutput: AutofillPurchaseDetailsOutput = {
        itemName: product.name,
        supplierName: supplier.name,
        buyPrice: product.buyPrice
    }

    return mockOutput;

    // The LLM-based approach would be:
    // const {output} = await prompt(input);
    // return output!;
  }
);
