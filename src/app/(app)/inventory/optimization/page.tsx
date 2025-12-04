'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import type { InventoryItem, Product, Store } from '@/lib/types';

export default function InventoryOptimizationPage() {
  const { inventory, products, stores } = useData();

  const orderSuggestions = useMemo(() => {
    return inventory
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        const store = stores.find(s => s.id === item.storeId);
        if (!product || !store) return null;
        
        const productName = item.variant_name ? `${product.name} (${item.variant_name})` : product.name;
        const reorderPoint = product.reorderPoint ?? 0;

        if (reorderPoint > 0 && item.stock <= reorderPoint) {
           return {
            id: item.id,
            productName,
            storeName: store.name,
            sku: product.sku,
            currentStock: item.stock,
            reorderPoint: reorderPoint,
            suggestedOrderQty: reorderPoint - item.stock > 0 ? reorderPoint - item.stock + 1 : 1,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [inventory, products, stores]);

  return (
    <div>
      <PageHeader title="Inventory Optimization" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Order Suggestions
          </CardTitle>
          <CardDescription>
            This report shows items that are at or below their reorder point and need to be restocked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="text-right font-bold text-primary">Suggested Order Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderSuggestions.length > 0 ? (
                  orderSuggestions.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.storeName}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">{item.currentStock}</TableCell>
                      <TableCell className="text-right">{item.reorderPoint}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{item.suggestedOrderQty}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No items need restocking at the moment. Well done!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
