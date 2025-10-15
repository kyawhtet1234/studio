
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InventoryItem, Product, Store } from "@/lib/types";
import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 3;

interface InventoryAlertsProps {
  inventory: InventoryItem[];
  products: Product[];
  stores: Store[];
  className?: string;
  style?: React.CSSProperties;
}

export function InventoryAlerts({ inventory, products, stores, className, style }: InventoryAlertsProps) {
  const lowStockItems = useMemo(() => {
    return inventory
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        const store = stores.find(s => s.id === item.storeId);
        if (!product || !store) return null;

        const productName = item.variant_name ? `${product.name} (${item.variant_name})` : product.name;

        return {
          ...item,
          productName: productName,
          storeName: store.name,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock);
  }, [inventory, products, stores]);

  return (
    <Card className={cn(className, "shadow-drop-shadow-black")} style={style}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Items with stock at or below {LOW_STOCK_THRESHOLD} units.</CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockItems.length > 0 ? (
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Remaining Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map(item => (
                  <TableRow key={item.id} className="hover:bg-destructive/10">
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.storeName}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{item.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">No items are currently low on stock. Well done!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
