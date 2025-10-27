

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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/lib/data-context";
import type { InventoryItem, Product } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AdjustmentItem {
  id: string;
  productId: string;
  storeId: string;
  variant_name: string;
  productName?: string;
  storeName?: string;
  currentStock: number;
}

export default function InventoryPage() {
  const { inventory, products, stores, categories, updateInventory, deleteInventoryItem } = useData();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("sku");
  const [adjustmentItem, setAdjustmentItem] = useState<AdjustmentItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdjustmentItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

  const inventoryData = useMemo(() => {
    return inventory
        .map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;

            // If a product has variants enabled, only show rows that have a variant name.
            if (product.variant_track_enabled && !item.variant_name) {
                return null;
            }
             // If a product does NOT have variants, only show the base row (without variant name).
            if (!product.variant_track_enabled && item.variant_name) {
                return null;
            }

            const store = stores.find(s => s.id === item.storeId);
            const category = categories.find(c => c.id === product.categoryId);
            const productName = product.name;
            const storeName = store?.name;

            return {
                ...item,
                productName: productName,
                sku: product.sku,
                categoryId: product.categoryId,
                categoryName: category?.name,
                storeName: storeName,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter(item => selectedStore === 'all' || item.storeId === selectedStore)
        .filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory)
        .sort((a, b) => {
            if (sortBy === 'sku') {
                return (a.sku || '').localeCompare(b.sku || '');
            }
            if (sortBy === 'category') {
                return (a.categoryName || '').localeCompare(b.categoryName || '');
            }
            return 0;
        });
  }, [inventory, selectedStore, selectedCategory, products, stores, categories, sortBy]);

  const handleOpenAdjustDialog = (item: (typeof inventoryData)[0]) => {
    setAdjustmentItem({
        id: item.id,
        productId: item.productId,
        storeId: item.storeId,
        variant_name: item.variant_name || "",
        productName: item.variant_name ? `${item.productName} (${item.variant_name})` : item.productName,
        storeName: item.storeName,
        currentStock: item.stock
    });
    setNewStock(item.stock);
  };
  
  const handleOpenDeleteDialog = (item: (typeof inventoryData)[0]) => {
    setDeleteCandidate({
        id: item.id,
        productId: item.productId,
        storeId: item.storeId,
        variant_name: item.variant_name || "",
        productName: item.variant_name ? `${item.productName} (${item.variant_name})` : item.productName,
        storeName: item.storeName,
        currentStock: item.stock
    });
  };

  const handleStockAdjustment = async () => {
    if (!adjustmentItem) return;

    const itemToUpdate: InventoryItem = {
      id: adjustmentItem.id,
      productId: adjustmentItem.productId,
      storeId: adjustmentItem.storeId,
      variant_name: adjustmentItem.variant_name || "",
      stock: newStock,
    };

    await updateInventory([itemToUpdate]);

    toast({ title: 'Success', description: `Stock for ${adjustmentItem.productName} updated to ${newStock}.`});
    setAdjustmentItem(null);
  };

  const handleItemDelete = async () => {
    if (!deleteCandidate) return;

    await deleteInventoryItem(deleteCandidate.id);
    toast({ title: 'Success', description: `${deleteCandidate.productName} has been deleted from ${deleteCandidate.storeName}.`});
    setDeleteCandidate(null);
  }

  const handleExportToExcel = () => {
    if (inventoryData.length === 0) {
      toast({ variant: 'destructive', title: 'No Data', description: 'There is no inventory data to export for the selected filters.' });
      return;
    }

    const dataToExport = inventoryData.map(item => ({
      SKU: item.sku,
      'Product Name': item.productName,
      'Variant': item.variant_name || '-',
      Category: item.categoryName,
      Store: item.storeName,
      Stock: item.stock,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    const storeName = selectedStore === 'all' ? 'All_Stores' : stores.find(s => s.id === selectedStore)?.name.replace(/ /g, '_') || 'Store';
    const date = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `Inventory_${storeName}_${date}.xlsx`);
  };

  return (
    <div>
      <PageHeader title="Inventory">
        <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={setSortBy} value={sortBy}>
                <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="sku">Sort by SKU</SelectItem>
                    <SelectItem value="category">Sort by Category</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:w-[180px]">
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
                <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:w-[180px]">
                    <SelectValue placeholder="Filter by store" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Link href="/inventory/adjustment">
              <Button>
                <RefreshCw className="mr-2 h-4 w-4" />
                Bulk Adjustment
              </Button>
            </Link>
            <Button variant="outline" onClick={handleExportToExcel}>
              <FileDown className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
        </div>
      </PageHeader>
      <Card className="bg-shiny-blue rounded-xl shadow-lg">
        <CardContent className="p-0">
          <div className="min-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-shiny-yellow hover:bg-shiny-yellow/90">
                  <TableHead className="text-black font-bold">SKU</TableHead>
                  <TableHead className="text-black font-bold">Product Name</TableHead>
                  <TableHead className="text-black font-bold">Variant</TableHead>
                  <TableHead className="text-black font-bold">Category</TableHead>
                  <TableHead className="text-black font-bold">Store</TableHead>
                  <TableHead className="text-right text-black font-bold">Stock</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.variant_name || '-'}</TableCell>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell>{item.storeName}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenAdjustDialog(item)}>
                                      Adjust Stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleOpenDeleteDialog(item)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                {inventoryData.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                            No inventory found for the selected filters.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
       <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory record for <strong>{deleteCandidate?.productName}</strong> at <strong>{deleteCandidate?.storeName}</strong>. This does not delete the product itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleItemDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
