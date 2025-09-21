
'use server';
/**
 * @fileOverview This file defines a Genkit flow that automatically fills item details (name, supplier, and buy price)
 * based on the SKU entered on the purchase page for a specific user.
 *
 * @exports autofillPurchaseDetails - The main function to trigger the flow.
 * @exports AutofillPurchaseDetailsInput - The input type for the autofillPurchaseDetails function.
 * @exports AutofillPurchaseDetailsOutput - The output type for the autofillPurchaseDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Product, Supplier } from '@/lib/types';


const AutofillPurchaseDetailsInputSchema = z.object({
  sku: z.string().describe('The Stock Keeping Unit (SKU) of the item.'),
  userId: z.string().describe('The ID of the user to fetch data for.'),
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
  async ({ sku, userId }) => {
    const productsRef = collection(db, 'users', userId, 'products');
    const q = query(productsRef, where('sku', '==', sku));
    const productsSnapshot = await getDocs(q);

    if (productsSnapshot.empty) {
      throw new Error('Product not found for the given SKU.');
    }
    
    const product = productsSnapshot.docs[0].data() as Product;

    if (!product.supplierId) {
        throw new Error('Product does not have a supplier.');
    }

    const supplierRef = doc(db, 'users', userId, 'suppliers', product.supplierId);
    const supplierSnapshot = await getDoc(supplierRef);

    if (!supplierSnapshot.exists()) {
        throw new Error('Supplier not found for the given product.');
    }

    const supplier = supplierSnapshot.data() as Supplier;
    
    const output: AutofillPurchaseDetailsOutput = {
        itemName: product.name,
        supplierName: supplier.name,
        buyPrice: product.buyPrice
    }

    return output;
  }
);
