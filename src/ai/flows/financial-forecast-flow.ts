
'use server';

/**
 * @fileOverview A financial forecasting AI agent.
 *
 * - generateFinancialForecast - A function that handles the forecast generation.
 * - FinancialHistoryInput - The input type for the flow.
 * - FinancialForecastOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { toDate } from '@/lib/utils';

const HistoricalEntrySchema = z.object({
    date: z.union([z.date(), z.string()]),
    amount: z.number(),
});

const FinancialForecastInputSchema = z.object({
  sales: z.array(HistoricalEntrySchema).describe("A list of historical sales records with date and amount."),
  expenses: z.array(HistoricalEntrySchema).describe("A list of historical expense records with date and amount."),
  products: z.array(z.object({
    id: z.string(),
    buyPrice: z.number(),
  })).describe("A list of products with their buying price for COGS calculation"),
  saleItems: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
      total: z.number(),
      date: z.union([z.date(), z.string()]),
  })).describe("A list of all items sold to help calculate historical COGS."),
  period: z.enum(['weekly', 'monthly', 'yearly']).describe("The forecast period to generate."),
});
export type FinancialForecastInput = z.infer<typeof FinancialForecastInputSchema>;

const ForecastEntrySchema = z.object({
    period: z.string().describe("The specific period for the forecast entry (e.g., 'Monday', '2024-01', '2025')."),
    forecastedSales: z.number().describe("The forecasted total sales for the period."),
    forecastedProfit: z.number().describe("The forecasted net profit for the period (Sales - COGS - Expenses)."),
});

const FinancialForecastOutputSchema = z.object({
  forecast: z.array(ForecastEntrySchema).describe("An array of forecast entries for the chosen period."),
  analysis: z.string().describe("A brief analysis of the forecast, including trends, seasonality, and key assumptions."),
});
export type FinancialForecastOutput = z.infer<typeof FinancialForecastOutputSchema>;


export async function generateFinancialForecast(input: FinancialForecastInput): Promise<FinancialForecastOutput> {
    return financialForecastFlow(input);
}

const financialForecastFlow = ai.defineFlow(
    {
        name: 'financialForecastFlow',
        inputSchema: FinancialForecastInputSchema,
        outputSchema: FinancialForecastOutputSchema,
    },
    async (input) => {
        
        let prompt = `You are an expert financial analyst for a small business.
        Your task is to provide a financial forecast for sales and NET PROFIT.
        To calculate profit, you must first calculate Cost of Goods Sold (COGS).
        Analyze the historical sales, sale items, products, and expense data to identify trends, seasonality, and growth patterns.
        
        Historical Sales:
        ${input.sales.map(s => `${toDate(s.date).toISOString().substring(0,10)}: MMK ${s.amount.toFixed(2)}`).join('\n')}

        Historical Expenses:
        ${input.expenses.map(e => `${toDate(e.date).toISOString().substring(0,10)}: MMK ${e.amount.toFixed(2)}`).join('\n')}
        
        Use the sale items and product buy prices to understand the historical COGS and profit margins.

        Based on this data, generate a forecast for the requested period.
        The user has requested a ${input.period} forecast.
        `;

        if (input.period === 'weekly') {
            prompt += `
            Generate a 7-day forecast, starting from Monday to Sunday.
            The 'period' for each entry should be the day of the week (e.g., 'Monday', 'Tuesday').
            `;
        } else if (input.period === 'monthly') {
            prompt += `
            Generate a month-by-month forecast for the next 12 months.
            The 'period' for each entry should be the month and year (e.g., 'YYYY-MM').
            `;
        } else if (input.period === 'yearly') {
            prompt += `
            Generate a year-by-year forecast for the next 3 years.
            The 'period' for each entry should be the year (e.g., '2025', '2026').
            `;
        }
        
        prompt += `
        Provide the output as a JSON object matching the defined schema, including both the forecast figures and a brief analysis.
        The analysis should be a short paragraph explaining the key drivers and assumptions behind your forecast.`;

        const { output } = await ai.generate({
            prompt: prompt,
            output: {
                schema: FinancialForecastOutputSchema,
            },
            config: {
                temperature: 0.2,
            }
        });
        
        return output!;
    }
);
