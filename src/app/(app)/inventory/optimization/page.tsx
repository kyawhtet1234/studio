
'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function InventoryOptimizationPage() {
  const { inventory, products, stores } = useData();

  const orderSuggestions = useMemo(() => {
    return inventory
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        const store = stores.find(s => s.id === item.storeId);
        if (!product || !store) return null;
        
        const productName = item.variant_name ? `${product.name} (${item.variant_name})` : product.name;

        // --- Calculations ---
        const {
          avgDailyDemand = 0, maxDailyDemand = 0, annualDemand = 0,
          orderCost = 0, holdingCost = 0, avgLeadTime = 0, maxLeadTime = 0
        } = product;

        const hasRequiredData = annualDemand > 0 && orderCost > 0 && holdingCost > 0 && maxLeadTime > 0;
        
        let safetyStock = 0;
        let reorderLevel = 0;
        let eoq = 0;
        let orderFrequency = 0;
        
        if (hasRequiredData) {
            safetyStock = (maxDailyDemand * maxLeadTime) - (avgDailyDemand * avgLeadTime);
            reorderLevel = (avgDailyDemand * avgLeadTime) + safetyStock;
            eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
            if (eoq > 0) {
              orderFrequency = annualDemand / eoq;
            }
        }
        
        const needsReorder = item.stock <= reorderLevel;

        if (needsReorder && hasRequiredData) {
           return {
            id: item.id,
            productName,
            storeName: store.name,
            sku: product.sku,
            currentStock: item.stock,
            reorderLevel: Math.round(reorderLevel),
            safetyStock: Math.round(safetyStock),
            eoq: Math.round(eoq),
            orderFrequency,
            urgency: item.stock / reorderLevel
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.urgency - b.urgency); // Sort by lowest stock ratio first
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
            This report shows items that are at or below their calculated reorder level and need to be restocked.
            Calculations require advanced inventory parameters to be set for each product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Safety Stock
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="h-4 w-4" /></TooltipTrigger>
                        <TooltipContent>Buffer stock to prevent stockouts.</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                     <div className="flex items-center justify-end gap-1">
                      Reorder Level
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="h-4 w-4" /></TooltipTrigger>
                        <TooltipContent>The stock level that triggers a new order.</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold text-primary">
                    <div className="flex items-center justify-end gap-1">
                        Optimal Order Qty (EOQ)
                        <Tooltip>
                            <TooltipTrigger><HelpCircle className="h-4 w-4" /></TooltipTrigger>
                            <TooltipContent>The ideal quantity to order each time to minimize costs.</TooltipContent>
                        </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Order Frequency
                      <Tooltip>
                          <TooltipTrigger><HelpCircle className="h-4 w-4" /></TooltipTrigger>
                          <TooltipContent>How many times per year to order this item.</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderSuggestions.length > 0 ? (
                  orderSuggestions.map(item => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.storeName}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">{item.currentStock}</TableCell>
                      <TableCell className="text-right">{item.safetyStock}</TableCell>
                      <TableCell className="text-right">{item.reorderLevel}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{item.eoq}</TableCell>
                       <TableCell className="text-right">{item.orderFrequency.toFixed(1)} / year</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No items need restocking at the moment, or required inventory parameters have not been set for products.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
