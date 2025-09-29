
'use client';

import { useMemo } from 'react';
import { PieChart, Pie, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { Expense, ExpenseCategory } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

interface ExpenseBreakdownChartProps {
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];


export function ExpenseBreakdownChart({ expenses, expenseCategories }: ExpenseBreakdownChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const categoryExpenses: { [key: string]: number } = {};

    expenses.forEach(expense => {
      const expenseDate = toDate(expense.date);
      if (expenseDate >= startOfMonth) {
        if (!categoryExpenses[expense.categoryId]) {
          categoryExpenses[expense.categoryId] = 0;
        }
        categoryExpenses[expense.categoryId] += expense.amount;
      }
    });

    const data = Object.entries(categoryExpenses).map(([categoryId, amount]) => {
      const category = expenseCategories.find(c => c.id === categoryId);
      return {
        name: category?.name || 'Uncategorized',
        amount: amount,
      };
    });

    const config = data.reduce((acc, item, index) => {
        const key = item.name;
        acc[key] = {
            label: item.name,
            color: CHART_COLORS[index % CHART_COLORS.length],
        };
        return acc;
    }, {} as any)


    return { chartData: data, chartConfig: config };
  }, [expenses, expenseCategories]);
  
  const totalExpenses = useMemo(() => chartData.reduce((sum, item) => sum + item.amount, 0), [chartData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>This Month's Expense Breakdown</CardTitle>
        <CardDescription>A pie chart showing the distribution of expenses by category for the current month.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[350px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => [`MMK ${Number(value).toLocaleString()}`, name]}
                />}
              />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
         ) : (
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-muted-foreground">No expenses recorded this month.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
