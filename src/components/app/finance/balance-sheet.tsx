
'use client';

import { useMemo } from 'react';
import type { CashAccount, InventoryItem, Product, Liability } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

interface BalanceSheetProps {
  cashAccounts: CashAccount[];
  inventory: InventoryItem[];
  products: Product[];
  liabilities: Liability[];
}

const formatCurrency = (amount: number) => {
    return `MMK ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BalanceSheet({ cashAccounts, inventory, products, liabilities }: BalanceSheetProps) {

  const { totalAssets, totalLiabilities, equity, inventoryValue } = useMemo(() => {
    const totalCash = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    const invValue = inventory.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = product ? product.buyPrice : 0;
        return sum + (cost * item.stock);
    }, 0);

    const assets = totalCash + invValue;
    const liabs = liabilities.reduce((sum, liab) => sum + liab.amount, 0);
    const eq = assets - liabs;

    return { totalAssets: assets, totalLiabilities: liabs, equity: eq, inventoryValue: invValue };
  }, [cashAccounts, inventory, products, liabilities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Sheet</CardTitle>
        <CardDescription>A snapshot of your business's financial health.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Assets */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Assets</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashAccounts.map(account => (
                    <TableRow key={account.id}>
                        <TableCell>Cash: {account.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                    </TableRow>
                ))}
                <TableRow>
                    <TableCell>Inventory Value</TableCell>
                    <TableCell className="text-right">{formatCurrency(inventoryValue)}</TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total Assets</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalAssets)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        {/* Liabilities */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
           <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Liability</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.length > 0 ? liabilities.map(l => (
                    <TableRow key={l.id}>
                        <TableCell>{l.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(l.amount)}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">No liabilities found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total Liabilities</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalLiabilities)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end p-6 bg-muted/50">
        <div className="flex items-center gap-4 text-lg">
            <span className="font-semibold">Owner's Equity (Assets - Liabilities):</span>
            <span className="font-bold text-xl text-primary">{formatCurrency(equity)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
