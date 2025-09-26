
'use client';

import { useMemo } from 'react';
import type { SaleTransaction, PurchaseTransaction, Expense } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

interface CashFlowReportProps {
  sales: SaleTransaction[];
  purchases: PurchaseTransaction[];
  expenses: Expense[];
}

interface MonthlyData {
  month: string;
  inflows: number;
  outflows: number;
  netFlow: number;
}

export function CashFlowReport({ sales, purchases, expenses }: CashFlowReportProps) {
  const cashFlowData = useMemo(() => {
    const monthlyData: { [key: string]: Omit<MonthlyData, 'month'> } = {};

    sales.forEach(sale => {
      if (sale.status === 'voided') return;
      const date = toDate(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflows: 0, outflows: 0, netFlow: 0 };
      }
      monthlyData[monthKey].inflows += sale.total;
    });

    purchases.forEach(purchase => {
      const date = toDate(purchase.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflows: 0, outflows: 0, netFlow: 0 };
      }
      monthlyData[monthKey].outflows += purchase.total;
    });

    expenses.forEach(expense => {
      const date = toDate(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflows: 0, outflows: 0, netFlow: 0 };
      }
      monthlyData[monthKey].outflows += expense.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        netFlow: data.inflows - data.outflows,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

  }, [sales, purchases, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Report</CardTitle>
        <CardDescription>Monthly summary of cash inflows and outflows.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Inflows (Sales)</TableHead>
              <TableHead className="text-right">Outflows (Purchases & Expenses)</TableHead>
              <TableHead className="text-right">Net Cash Flow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashFlowData.map((data) => (
              <TableRow key={data.month}>
                <TableCell>{data.month}</TableCell>
                <TableCell className="text-right text-green-600">MMK {data.inflows.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-red-600">MMK {data.outflows.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className={`text-right font-semibold ${data.netFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  MMK {data.netFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
            {cashFlowData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No cash flow data available.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
