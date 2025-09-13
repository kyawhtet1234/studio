
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";
import { sales } from "@/lib/data";
import { useMemo } from "react";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
};

export function SalesChart() {
  const monthlySales = useMemo(() => {
    const data = new Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return { date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), sales: 0 };
    });

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays >= 0 && diffDays < 30) {
        const index = 29 - diffDays;
        data[index].sales += sale.total;
      }
    });

    return data;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales of the Month</CardTitle>
        <CardDescription>Showing sales data for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                  formatter={(value) => `MMK ${Number(value).toFixed(2)}`}
                  indicator="dot"
                />}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke={chartConfig.sales.color} 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
