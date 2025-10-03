
'use client';

import { useMemo } from 'react';
import type { SaleTransaction, Product, Expense } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { toDate } from '@/lib/utils';
import { format } from 'date-fns';

interface NetProfitReportProps {
  sales: SaleTransaction[];
  products: Product[];
  expenses: Expense[];
}

interface MonthlyReport {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

const formatCurrency = (amount: number) => {
    return `MMK ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function NetProfitReport({ sales, products, expenses }: NetProfitReportProps) {

  const { monthlyData, totals } = useMemo(() => {
    const data: { [key: string]: Omit<MonthlyReport, 'month'> } = {};

    // Process Sales for Revenue and COGS
    sales.forEach(sale => {
      if (sale.status === 'voided' || sale.status === 'quotation') return;
      const date = toDate(sale.date);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!data[monthKey]) {
        data[monthKey] = { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 };
      }

      data[monthKey].revenue += sale.total;
      
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          data[monthKey].cogs += product.buyPrice * item.quantity;
        }
      });
    });

    // Process Expenses
    expenses.forEach(expense => {
      const date = toDate(expense.date);
      const monthKey = format(date, 'yyyy-MM');

      if (!data[monthKey]) {
        data[monthKey] = { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 };
      }
      data[monthKey].expenses += expense.amount;
    });

    // Calculate profits and create final array
    const finalData = Object.entries(data).map(([month, values]) => {
      const grossProfit = values.revenue - values.cogs;
      const netProfit = grossProfit - values.expenses;
      return { month, ...values, grossProfit, netProfit };
    }).sort((a, b) => b.month.localeCompare(a.month));

    const reportTotals = finalData.reduce((acc, month) => {
        acc.revenue += month.revenue;
        acc.cogs += month.cogs;
        acc.grossProfit += month.grossProfit;
        acc.expenses += month.expenses;
        acc.netProfit += month.netProfit;
        return acc;
    }, { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 });

    return { monthlyData: finalData, totals: reportTotals };
  }, [sales, products, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Profit Report</CardTitle>
        <CardDescription>A monthly breakdown of your revenue, costs, and profit.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Revenue (Sales)</TableHead>
              <TableHead className="text-right">COGS</TableHead>
              <TableHead className="text-right">Gross Profit</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Net Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.length > 0 ? monthlyData.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{format(new Date(row.month), 'MMMM yyyy')}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatCurrency(row.cogs)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(row.grossProfit)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatCurrency(row.expenses)}</TableCell>
                <TableCell className={`text-right font-bold ${row.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(row.netProfit)}
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No financial data available for this period.</TableCell>
                </TableRow>
            )}
          </TableBody>
           {monthlyData.length > 0 && (
            <TableFooter>
                <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totals.revenue)}</TableCell>
                    <TableCell className="text-right font-bold text-muted-foreground">{formatCurrency(totals.cogs)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(totals.grossProfit)}</TableCell>
                    <TableCell className="text-right font-bold text-muted-foreground">{formatCurrency(totals.expenses)}</TableCell>
                    <TableCell className={`text-right font-extrabold ${totals.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(totals.netProfit)}
                    </TableCell>
                </TableRow>
            </TableFooter>
           )}
        </Table>
      </CardContent>
    </Card>
  );
}
