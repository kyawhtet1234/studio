
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import type { SaleTransaction } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
};

export function SalesChart({ sales }: { sales: SaleTransaction[]}) {
  const monthlySales = useMemo(() => {
    const data = new Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return { date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), sales: 0 };
    });

    sales.forEach(sale => {
      const saleDate = (sale.date as Timestamp)?.toDate ? (sale.date as Timestamp).toDate() : new Date(sale.date);
      const today = new Date();
      const diffTime = today.getTime() - saleDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      
      if (diffDays >= 0 && diffDays < 30) {
        const index = 29 - diffDays;
        if(data[index]) {
            data[index].sales += sale.total;
        }
      }
    });

    return data;
  }, [sales]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales of the Month</CardTitle>
        <CardDescription>Showing sales data for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `MMK ${Number(value).toLocaleString()}`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
                tick={{ fontSize: 12 }}
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
      </CardContent>
    </Card>
  );
}
