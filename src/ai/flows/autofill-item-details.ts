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

const prompt = ai.definePrompt({
  name: 'autofillItemDetailsPrompt',
  input: {schema: AutofillItemDetailsInputSchema},
  output: {schema: AutofillItemDetailsOutputSchema},
  prompt: `You are a helpful assistant that retrieves item details based on the provided SKU.

  Given the following SKU, please provide the item name and sell price.

  SKU: {{{sku}}}

  Please respond with the item name and sell price in JSON format.
  Make sure the sellPrice is a number.
  Example:
  {
    "itemName": "Example Item Name",
    "sellPrice": 9.99
  }`,
});

const autofillItemDetailsFlow = ai.defineFlow(
  {
    name: 'autofillItemDetailsFlow',
    inputSchema: AutofillItemDetailsInputSchema,
    outputSchema: AutofillItemDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
