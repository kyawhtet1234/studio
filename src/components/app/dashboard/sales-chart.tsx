
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { useMemo } from "react";
import type { SaleTransaction } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { useData } from "@/lib/data-context";
import { format, subDays, startOfDay } from 'date-fns';

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

export function SalesChart({ sales, className, style }: { sales: SaleTransaction[], className?: string, style?: React.CSSProperties, isFiltered?: boolean}) {
  const { settings } = useData();
  const dailySalesGoal = settings.goals?.dailySalesGoal;

  const { monthlySales, hasSales } = useMemo(() => {
    // Initialize data for the last 30 days
    const data = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), i);
      return {
        date: format(startOfDay(d), 'MMM d'), // e.g., "Nov 14"
        sales: 0,
      };
    }).reverse();

    const dateMap = new Map<string, { date: string; sales: number }>();
    data.forEach(d => dateMap.set(d.date, d));

    let hasSales = false;
    
    const completedSales = sales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
      const saleDate = toDate(sale.date);
      const dateKey = format(startOfDay(saleDate), 'MMM d');
      
      if (dateMap.has(dateKey)) {
        const dayData = dateMap.get(dateKey)!;
        dayData.sales += sale.total;
        if (sale.total > 0) hasSales = true;
      }
    });

    return { monthlySales: Array.from(dateMap.values()), hasSales };
  }, [sales]);

  const darkBlueStyle = { fill: 'hsl(220 25% 10%)', fontWeight: 'bold' };

  return (
    <Card className={cn(className, "shadow-drop-shadow-black")} style={style}>
      <CardHeader>
        <CardTitle className="text-[hsl(220_25%_10%)] font-bold">Sales of the Month</CardTitle>
        <CardDescription className="text-[hsl(220_25%_10%)] font-bold">Showing sales data for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSales ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={darkBlueStyle}
                />
                <YAxis 
                  tickFormatter={(value) => `MMK ${Number(value).toLocaleString()}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tick={darkBlueStyle}
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
                {dailySalesGoal && (
                  <ReferenceLine
                    y={dailySalesGoal}
                    label={{ value: `Goal: ${dailySalesGoal.toLocaleString()}`, position: 'insideTopRight', fill: 'hsl(var(--destructive))' }}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="3 3"
                  />
                )}
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
