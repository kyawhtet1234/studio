
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFinancialForecast, type FinancialForecastOutput, type FinancialForecastInput } from '@/ai/flows/financial-forecast-flow';
import type { SaleTransaction, Expense, Product } from '@/lib/types';
import { Loader2, Wand } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toDate } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ForecastPeriod = 'weekly' | 'monthly' | 'yearly';

interface FinancialForecastProps {
  sales: SaleTransaction[];
  expenses: Expense[];
  products: Product[];
  saleItems: FinancialForecastInput['saleItems'];
}

const chartConfig = {
  forecastedSales: { label: 'Sales', color: 'hsl(var(--chart-2))' },
  forecastedProfit: { label: 'Profit', color: 'hsl(var(--chart-3))' },
};

export function FinancialForecast({ sales, expenses, products, saleItems }: FinancialForecastProps) {
  const [forecast, setForecast] = useState<FinancialForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>('monthly');

  const handleGenerateForecast = async () => {
    setIsLoading(true);
    setForecast(null);
    try {
      const historicalSales = sales.map(s => ({ date: toDate(s.date).toISOString(), amount: s.total }));
      const historicalExpenses = expenses.map(e => ({ date: toDate(e.date).toISOString(), amount: e.amount }));
      const historicalSaleItems = saleItems.map(si => ({ ...si, date: toDate(si.date).toISOString() }));

      const result = await generateFinancialForecast({ 
          sales: historicalSales, 
          expenses: historicalExpenses,
          products: products.map(p => ({ id: p.id, buyPrice: p.buyPrice })),
          saleItems: historicalSaleItems,
          period: forecastPeriod 
      });
      setForecast(result);
    } catch (error) {
      console.error("Error generating forecast:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!forecast) return [];
    
    if (forecastPeriod === 'weekly') {
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return forecast.forecast.sort((a,b) => order.indexOf(a.period) - order.indexOf(b.period));
    }

    return forecast.forecast.sort((a, b) => a.period.localeCompare(b.period));
  }, [forecast, forecastPeriod]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Financial Forecast</CardTitle>
        <CardDescription>Generate a sales and profit forecast based on your historical data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
            <div className="w-full sm:w-auto">
                <Select value={forecastPeriod} onValueChange={(value) => setForecastPeriod(value as ForecastPeriod)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleGenerateForecast} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
              Generate Forecast
            </Button>
        </div>
        
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
                        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickFormatter={(value) => `MMK ${Number(value / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="forecastedSales" fill={chartConfig.forecastedSales.color} radius={4} />
                        <Bar dataKey="forecastedProfit" fill={chartConfig.forecastedProfit.color} radius={4} />
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
                            <TableHead className="capitalize">{forecastPeriod.slice(0, -2)}</TableHead>
                            <TableHead className="text-right">Forecasted Sales</TableHead>
                            <TableHead className="text-right">Forecasted Profit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {chartData.map((item) => (
                            <TableRow key={item.period}>
                                <TableCell className="font-medium">{item.period}</TableCell>
                                <TableCell className="text-right">MMK {item.forecastedSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">MMK {item.forecastedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
