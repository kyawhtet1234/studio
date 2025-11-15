
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { SaleTransaction, Product, Category } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { useMemo } from 'react';
import { PieChart, Pie, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface ProfitByCategoryChartProps {
  sales: SaleTransaction[];
  products: Product[];
  categories: Category[];
  className?: string;
  style?: React.CSSProperties;
}

export function ProfitByCategoryChart({ sales, products, categories, className, style }: ProfitByCategoryChartProps) {
  const { profitByCategory, chartConfig } = useMemo(() => {
    const categoryProfit: { [key: string]: { name: string, profit: number } } = {};

    const completedSales = sales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
      const saleDate = toDate(sale.date);
      const today = new Date();
      // Only include sales from the current month
      if (saleDate.getFullYear() === today.getFullYear() && saleDate.getMonth() === today.getMonth()) {
        sale.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const category = categories.find(c => c.id === product.categoryId);
            const categoryName = category?.name || 'Uncategorized';
            const itemProfit = (item.sellPrice - product.buyPrice) * item.quantity;
            
            if (!categoryProfit[product.categoryId]) {
              categoryProfit[product.categoryId] = { name: categoryName, profit: 0 };
            }
            categoryProfit[product.categoryId].profit += itemProfit;
          }
        });
      }
    });

    const sortedData = Object.values(categoryProfit)
      .filter(c => c.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    const config = sortedData.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: CHART_COLORS[index % CHART_COLORS.length],
        };
        return acc;
    }, {} as any);

    return { profitByCategory: sortedData, chartConfig: config };
  }, [sales, products, categories]);

  return (
    <Card className={cn(className, "shadow-drop-shadow-black")} style={style}>
      <CardHeader>
        <CardTitle>Profit by Category</CardTitle>
        <CardDescription>Top 5 most profitable categories this month.</CardDescription>
      </CardHeader>
      <CardContent>
         {profitByCategory.length > 0 ? (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[350px]">
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
                  data={profitByCategory}
                  dataKey="profit"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {profitByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
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
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No profit data for this month.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
