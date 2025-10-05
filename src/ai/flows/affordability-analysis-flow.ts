
'use server';

/**
 * @fileOverview An AI agent for analyzing financial affordability of new expenses.
 *
 * - analyzeAffordability - A function that handles the affordability analysis.
 * - AffordabilityAnalysisInput - The input type for the flow.
 * - AffordabilityAnalysisOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { toDate } from '@/lib/utils';

// Schemas are not exported because of 'use server' constraints.
// Types are derived from them and exported instead.

const HistoricalEntrySchema = z.object({
    date: z.union([z.date(), z.string()]),
    amount: z.number(),
});

const AffordabilityAnalysisInputSchema = z.object({
  historicalSales: z.array(HistoricalEntrySchema).describe("A list of historical sales records with date and amount."),
  historicalExpenses: z.array(HistoricalEntrySchema).describe("A list of historical expense records with date and amount."),
  currentCashBalance: z.number().describe("The current total cash balance across all accounts."),
  newMonthlyExpense: z.number().describe("The new recurring monthly expense to analyze."),
  durationInMonths: z.number().int().positive().describe("The number of months to project the analysis for."),
});
export type AffordabilityAnalysisInput = z.infer<typeof AffordabilityAnalysisInputSchema>;

const MonthlyProjectionSchema = z.object({
    month: z.string().describe("The month of the projection (e.g., 'YYYY-MM')."),
    projectedCashBalance: z.number().describe("The projected ending cash balance for the month after all income and expenses."),
    isNegative: z.boolean().describe("True if the projected cash balance for the month is negative."),
});

const AffordabilityAnalysisOutputSchema = z.object({
  isAffordable: z.boolean().describe("A simple true/false conclusion on whether the new expense is affordable without causing a negative cash balance."),
  analysis: z.string().describe("A brief, clear analysis explaining the conclusion. Mention when and if the cash balance might go negative."),
  projection: z.array(MonthlyProjectionSchema).describe("An array of monthly projections for the specified duration."),
});
export type AffordabilityAnalysisOutput = z.infer<typeof AffordabilityAnalysisOutputSchema>;


export async function analyzeAffordability(input: AffordabilityAnalysisInput): Promise<AffordabilityAnalysisOutput> {
    return affordabilityAnalysisFlow(input);
}

const affordabilityAnalysisFlow = ai.defineFlow(
    {
        name: 'affordabilityAnalysisFlow',
        inputSchema: AffordabilityAnalysisInputSchema,
        outputSchema: AffordabilityAnalysisOutputSchema,
    },
    async (input) => {
        const prompt = `You are an expert financial analyst for a small business.
        Your task is to determine if the business can afford a new recurring monthly expense of ${input.newMonthlyExpense.toLocaleString()} MMK.

        First, analyze the provided historical sales and expense data to generate a baseline monthly forecast (net cash flow) for the next ${input.durationInMonths} months.
        
        Historical Sales:
        ${input.historicalSales.map(s => `${toDate(s.date).toISOString().substring(0,10)}: ${s.amount.toFixed(2)}`).join('\n')}

        Historical Expenses:
        ${input.historicalExpenses.map(e => `${toDate(e.date).toISOString().substring(0,10)}: ${e.amount.toFixed(2)}`).join('\n')}

        The business's current total cash balance is ${input.currentCashBalance.toLocaleString()} MMK.

        Now, create a projection for the next ${input.durationInMonths} months. For each month:
        1. Start with the previous month's ending cash balance (or the current balance for the first month).
        2. Add the forecasted monthly net cash flow (forecasted sales - forecasted base expenses).
        3. Subtract the new monthly expense of ${input.newMonthlyExpense.toLocaleString()} MMK.
        4. The result is the projected ending cash balance for that month.

        Based on this projection, determine if the cash balance ever drops below zero.
        - If it never goes below zero, set 'isAffordable' to true.
        - If it drops below zero in any month, set 'isAffordable' to false.

        Provide a brief, clear 'analysis' explaining your conclusion. Be direct. For example: "Yes, based on the forecast, your cash balance remains positive throughout the next 12 months." or "No, this is not recommended. Your cash balance is projected to become negative in [Month, YYYY]."

        Finally, provide the full month-by-month projection table.
        Provide the output as a single JSON object matching the defined schema.`;

        const { output } = await ai.generate({
            prompt: prompt,
            output: {
                schema: AffordabilityAnalysisOutputSchema,
            },
            config: {
                temperature: 0, // Use a low temperature for predictable financial analysis
            }
        });
        
        return output!;
    }
);
