
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
    date: z.union([z.date(), z.string()]).transform(arg => toDate(arg)),
    amount: z.number(),
});

const FinancialHistoryInputSchema = z.object({
  sales: z.array(HistoricalEntrySchema).describe("A list of historical sales records with date and amount."),
  expenses: z.array(HistoricalEntrySchema).describe("A list of historical expense records with date and amount."),
});
export type FinancialHistoryInput = z.infer<typeof FinancialHistoryInputSchema>;

const ForecastEntrySchema = z.object({
    month: z.string().describe("The month of the forecast (e.g., 'YYYY-MM')."),
    forecastedSales: z.number().describe("The forecasted total sales for the month."),
    forecastedExpenses: z.number().describe("The forecasted total expenses for the month."),
});

const FinancialForecastOutputSchema = z.object({
  forecast: z.array(ForecastEntrySchema).describe("An array of monthly forecasts for the next 6 months."),
  analysis: z.string().describe("A brief analysis of the forecast, including trends, seasonality, and key assumptions."),
});
export type FinancialForecastOutput = z.infer<typeof FinancialForecastOutputSchema>;


export async function generateFinancialForecast(input: FinancialHistoryInput): Promise<FinancialForecastOutput> {
    return financialForecastFlow(input);
}

const financialForecastFlow = ai.defineFlow(
    {
        name: 'financialForecastFlow',
        inputSchema: FinancialHistoryInputSchema,
        outputSchema: FinancialForecastOutputSchema,
    },
    async (input) => {
        
        const prompt = `You are an expert financial analyst for a small business.
        Your task is to provide a financial forecast for the next 6 months based on the historical data provided.
        Analyze the historical sales and expense data to identify trends, seasonality, and growth patterns.
        
        Historical Sales:
        ${input.sales.map(s => `${s.date.toISOString().substring(0,10)}: MMK ${s.amount.toFixed(2)}`).join('\n')}

        Historical Expenses:
        ${input.expenses.map(e => `${e.date.toISOString().substring(0,10)}: MMK ${e.amount.toFixed(2)}`).join('\n')}
        
        Based on this data, generate a month-by-month forecast for the next 6 months.
        Provide the output as a JSON object matching the defined schema, including both the forecast figures and a brief analysis.
        The analysis should be a short paragraph explaining the key drivers and assumptions behind your forecast.`;

        const { output } = await ai.generate({
            prompt: prompt,
            output: {
                schema: FinancialForecastOutputSchema,
            }
        });
        
        return output!;
    }
);
