
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import type { SaleTransaction } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';
import { cn } from "@/lib/utils";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-3))",
  },
};

const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export function SalesChart({ sales, className, style }: { sales: SaleTransaction[], className?: string, style?: React.CSSProperties}) {
  const { monthlySales, hasSales } = useMemo(() => {
    const data = new Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return { date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), sales: 0 };
    });

    let hasSales = false;

    const completedSales = sales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
      const saleDate = toDate(sale.date);
      const today = new Date();
      const diffTime = today.getTime() - saleDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      
      if (diffDays >= 0 && diffDays < 30) {
        const index = 29 - diffDays;
        if(data[index]) {
            data[index].sales += sale.total;
            if (sale.total > 0) {
              hasSales = true;
            }
        }
      }
    });

    return { monthlySales: data, hasSales };
  }, [sales]);

  return (
    <Card className={cn(className, "shadow-drop-shadow-black")} style={style}>
      <CardHeader>
        <CardTitle>Sales of the Month</CardTitle>
        <CardDescription>Showing sales data for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSales ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: 'white' }}
                />
                <YAxis 
                  tickFormatter={(value) => `MMK ${Number(value).toLocaleString()}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tick={{ fill: 'white' }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    formatter={(value) => `MMK ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    indicator="dot"
                  />}
                />
                <Bar 
                  dataKey="sales" 
                  fill={chartConfig.sales.color} 
                  radius={4}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No sales data for the last 30 days.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
