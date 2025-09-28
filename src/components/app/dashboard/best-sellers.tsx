
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SaleTransaction, Product } from "@/lib/types";
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

export function BestSellers({ sales, products, className }: { sales: SaleTransaction[], products: Product[], className?: string }) {
  const { bestSellingItems, chartConfig } = useMemo(() => {
    const itemSales: { [key: string]: { name: string, quantity: number, total: number } } = {};

    const completedSales = sales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
      const saleDate = toDate(sale.date);
      const today = new Date();
      const monthDiff = today.getMonth() - saleDate.getMonth() + (12 * (today.getFullYear() - saleDate.getFullYear()));

      if (monthDiff === 0) { // Only for the current month
        sale.items.forEach(item => {
          if (!itemSales[item.productId]) {
            const product = products.find(p => p.id === item.productId);
            itemSales[item.productId] = { name: product?.name || 'Unknown', quantity: 0, total: 0 };
          }
          
          const discountRatio = sale.subtotal > 0 ? item.total / sale.subtotal : 0;
          const itemDiscount = sale.discount * discountRatio;
          const salesAfterDiscount = item.total - itemDiscount;

          itemSales[item.productId].quantity += item.quantity;
          itemSales[item.productId].total += salesAfterDiscount;
        });
      }
    });

    const sortedItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
      
    const config = sortedItems.reduce((acc, item, index) => {
        const key = item.name;
        acc[key] = {
            label: item.name,
            color: `hsl(var(--chart-${index + 1}))`,
        };
        return acc;
    }, {} as any);

    return { bestSellingItems: sortedItems, chartConfig: config };
  }, [sales, products]);


  return (
    <Card className={cn(className, "shadow-drop-shadow-black")}>
      <CardHeader>
        <CardTitle>Best Selling Items</CardTitle>
        <CardDescription>Top 5 best selling items this month by quantity.</CardDescription>
      </CardHeader>
      <CardContent>
         {bestSellingItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent
                            hideLabel
                            formatter={(value, name) => [`${value} units sold`, name]}
                        />}
                    />
                    <Pie
                        data={bestSellingItems}
                        dataKey="quantity"
                        nameKey="name"
                        innerRadius={50}
                        strokeWidth={5}
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                         {bestSellingItems.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestSellingItems.map((item, index) => (
                  <TableRow key={index}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
            <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No best sellers this month.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
