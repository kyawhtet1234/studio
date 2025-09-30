
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFinancialForecast, type FinancialForecastOutput } from '@/ai/flows/financial-forecast-flow';
import type { SaleTransaction, Expense } from '@/lib/types';
import { Loader2, Wand } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toDate } from '@/lib/utils';


interface FinancialForecastProps {
  sales: SaleTransaction[];
  expenses: Expense[];
}

const chartConfig = {
  historicalSales: { label: 'Historical Sales', color: 'hsl(var(--chart-1))' },
  forecastedSales: { label: 'Forecasted Sales', color: 'hsl(var(--chart-2))' },
  historicalExpenses: { label: 'Historical Expenses', color: 'hsl(var(--chart-3))' },
  forecastedExpenses: { label: 'Forecasted Expenses', color: 'hsl(var(--chart-4))' },
};

export function FinancialForecast({ sales, expenses }: FinancialForecastProps) {
  const [forecast, setForecast] = useState<FinancialForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateForecast = async () => {
    setIsLoading(true);
    setForecast(null);
    try {
      const historicalSales = sales.map(s => ({ date: toDate(s.date).toISOString(), amount: s.total }));
      const historicalExpenses = expenses.map(e => ({ date: toDate(e.date).toISOString(), amount: e.amount }));

      const result = await generateFinancialForecast({ sales: historicalSales, expenses: historicalExpenses });
      setForecast(result);
    } catch (error) {
      console.error("Error generating forecast:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!forecast) return [];

    const combinedData: { [key: string]: any } = {};

    const processHistory = (data: any[], key: string) => {
        data.forEach(item => {
            const date = toDate(item.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!combinedData[monthKey]) combinedData[monthKey] = { month: monthKey };
            combinedData[monthKey][key] = (combinedData[monthKey][key] || 0) + item.amount;
        });
    };

    processHistory(sales, 'historicalSales');
    processHistory(expenses, 'historicalExpenses');

    forecast.forecast.forEach(f => {
        if (!combinedData[f.month]) combinedData[f.month] = { month: f.month };
        combinedData[f.month].forecastedSales = f.forecastedSales;
        combinedData[f.month].forecastedExpenses = f.forecastedExpenses;
    });

    return Object.values(combinedData).sort((a, b) => a.month.localeCompare(b.month));

  }, [forecast, sales, expenses]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Financial Forecast</CardTitle>
        <CardDescription>Generate a 6-month sales and expense forecast based on your historical data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!forecast && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Wand className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Click the button to generate your financial forecast.</p>
            <Button onClick={handleGenerateForecast}>
              <Wand className="mr-2 h-4 w-4" />
              Generate Forecast
            </Button>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Generating your forecast... this may take a moment.</p>
          </div>
        )}
        {forecast && (
          <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">{forecast.analysis}</p>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Forecast Chart</h3>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickFormatter={(value) => `MMK ${Number(value / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="historicalSales" fill={chartConfig.historicalSales.color} radius={4} />
                        <Bar dataKey="forecastedSales" fill={chartConfig.forecastedSales.color} radius={4} />
                        <Bar dataKey="historicalExpenses" fill={chartConfig.historicalExpenses.color} radius={4} />
                        <Bar dataKey="forecastedExpenses" fill={chartConfig.forecastedExpenses.color} radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
             <div>
                <h3 className="text-lg font-semibold mb-4">Forecast Data</h3>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Forecasted Sales</TableHead>
                            <TableHead className="text-right">Forecasted Expenses</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forecast.forecast.map((item) => (
                            <TableRow key={item.month}>
                                <TableCell className="font-medium">{item.month}</TableCell>
                                <TableCell className="text-right">MMK {item.forecastedSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">MMK {item.forecastedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
             <div className="text-center">
                <Button variant="outline" onClick={handleGenerateForecast}>
                    <Wand className="mr-2 h-4 w-4" />
                    Regenerate Forecast
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
