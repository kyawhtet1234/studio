
'use client';

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/app/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/lib/data-context";
import type { InventoryItem } from "@/lib/types";

interface AdjustmentItem {
  productId: string;
  storeId: string;
  productName?: string;
  storeName?: string;
  currentStock: number;
}

export default function InventoryPage() {
  const { inventory, products, stores, categories, updateInventory } = useData();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [adjustmentItem, setAdjustmentItem] = useState<AdjustmentItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

  const inventoryData = useMemo(() => {
    return inventory
        .map(item => {
            const product = products.find(p => p.id === item.productId);
            const store = stores.find(s => s.id === item.storeId);
            const category = categories.find(c => c.id === product?.categoryId);
            return {
                ...item,
                productName: product?.name,
                sku: product?.sku,
                categoryId: product?.categoryId,
                categoryName: category?.name,
                storeName: store?.name,
            };
        })
        .filter(item => selectedStore === 'all' || item.storeId === selectedStore)
        .filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory);
  }, [inventory, selectedStore, selectedCategory, products, stores, categories]);

  const handleOpenAdjustDialog = (item: { productId: string; storeId: string; productName?: string; storeName?: string, stock: number }) => {
    setAdjustmentItem({
        productId: item.productId,
        storeId: item.storeId,
        productName: item.productName,
        storeName: item.storeName,
        currentStock: item.stock
    });
    setNewStock(item.stock);
  };

  const handleStockAdjustment = async () => {
    if (!adjustmentItem) return;

    await updateInventory([{
        productId: adjustmentItem.productId,
        storeId: adjustmentItem.storeId,
        stock: newStock
    }]);

    toast({ title: 'Success', description: `Stock for ${adjustmentItem.productName} updated to ${newStock}.`});
    setAdjustmentItem(null);
  };

  return (
    <div>
      <PageHeader title="Inventory">
        <div className="flex items-center gap-2">
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select onValueChange={setSelectedStore} value={selectedStore}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by store" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </PageHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item) => (
                <TableRow key={`${item.productId}_${item.storeId}`}>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{item.storeName}</TableCell>
                    <TableCell className="text-right">{item.stock}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenAdjustDialog(item)}>
                            Adjust
                        </Button>
                    </TableCell>
                </TableRow>
            ))}
             {inventoryData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No inventory found for the selected filters.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!adjustmentItem} onOpenChange={() => setAdjustmentItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Update the stock quantity for <span className="font-semibold">{adjustmentItem?.productName}</span> at <span className="font-semibold">{adjustmentItem?.storeName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="current-stock">Current Stock</Label>
                <Input id="current-stock" value={adjustmentItem?.currentStock ?? ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-stock">New Stock Quantity</Label>
                <Input id="new-stock" type="number" value={newStock} onChange={(e) => setNewStock(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleStockAdjustment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
