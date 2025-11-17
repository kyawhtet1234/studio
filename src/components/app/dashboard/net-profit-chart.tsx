
'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SaleTransaction, Product, Expense } from '@/lib/types';
import { toDate } from '@/lib/utils';
import { format, subMonths, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthlyReport {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  netProfitPercentage: number;
}

const chartConfig = {
  netProfit: { label: 'Net Profit', color: 'hsl(var(--chart-1))' },
};

export function NetProfitChart({ sales, products, expenses, className }: { sales: SaleTransaction[], products: Product[], expenses: Expense[], className?:string }) {
  const monthlyData = useMemo(() => {
    const data: { [key: string]: Omit<MonthlyReport, 'month' | 'netProfitPercentage'> } = {};

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const monthKey = format(startOfMonth(d), 'yyyy-MM');
        data[monthKey] = { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 };
    }

    // Process Sales for Revenue and COGS
    sales.forEach(sale => {
      if (sale.status === 'voided' || sale.status === 'quotation') return;
      const date = toDate(sale.date);
      const monthKey = format(date, 'yyyy-MM');
      
      if (data[monthKey]) {
        data[monthKey].revenue += sale.total;
        sale.items.forEach(item => {
          data[monthKey].cogs += item.cogs || (products.find(p => p.id === item.productId)?.buyPrice || 0) * item.quantity;
        });
      }
    });

    // Process Expenses
    expenses.forEach(expense => {
      const date = toDate(expense.date);
      const monthKey = format(date, 'yyyy-MM');
      if (data[monthKey]) {
        data[monthKey].expenses += expense.amount;
      }
    });

    // Calculate profits and create final array
    return Object.entries(data).map(([month, values]) => {
      const grossProfit = values.revenue - values.cogs;
      const netProfit = grossProfit - values.expenses;
      const netProfitPercentage = values.revenue > 0 ? (netProfit / values.revenue) * 100 : 0;
      return { 
        month: format(new Date(month), 'MMM yy'), 
        ...values, 
        grossProfit, 
        netProfit,
        netProfitPercentage,
      };
    });
  }, [sales, products, expenses]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Monthly Net Profit</CardTitle>
        <CardDescription>Net profit (Sales - COGS - Expenses) over the last 12 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <CartesianGrid vertical={false} />
              <XAxis 
                dataKey="month" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis 
                tickFormatter={(value) => `MMK ${Number(value / 1000).toFixed(0)}k`}
                width={80}
              />
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const { payload } = props;
                      const percentage = payload.netProfitPercentage;
                      return [`MMK ${Number(value).toLocaleString()}`, `${percentage.toFixed(1)}% Margin`];
                    }}
                    indicator="dot" 
                />} 
              />
              <Bar 
                dataKey="netProfit" 
                fill={chartConfig.netProfit.color} 
                radius={4} 
              />
               <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
