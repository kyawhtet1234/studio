
'use client';

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";
import type { InventoryItem } from "@/lib/types";
import { useData } from "@/lib/data-context";

interface TransferItem {
    sku: string;
    productId: string;
    name: string;
    quantity: number;
}

export default function TransferPage() {
    const { toast } = useToast();
    const { stores, products, inventory, updateInventory } = useData();
    const [fromStoreId, setFromStoreId] = useState<string>('');
    const [toStoreId, setToStoreId] = useState<string>('');
    const [itemSku, setItemSku] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);

    const handleAddItem = () => {
        if (!fromStoreId || !toStoreId) {
            toast({ variant: 'destructive', title: 'Error', description: "Please select 'From' and 'To' stores."});
            return;
        }
        if (fromStoreId === toStoreId) {
            toast({ variant: 'destructive', title: 'Error', description: "Source and destination stores cannot be the same."});
            return;
        }

        const product = products.find(p => p.sku === itemSku);
        if (!product) {
            toast({ variant: 'destructive', title: 'Error', description: "Product with this SKU not found."});
            return;
        }

        const sourceInventory = inventory.find(i => i.productId === product.id && i.storeId === fromStoreId);
        if (!sourceInventory || sourceInventory.stock < itemQuantity) {
            toast({ variant: 'destructive', title: 'Error', description: `Not enough stock in ${stores.find(s=>s.id === fromStoreId)?.name}. Available: ${sourceInventory?.stock || 0}`});
            return;
        }

        if (transferItems.find(item => item.sku === itemSku)) {
            toast({ variant: 'destructive', title: 'Error', description: "Item is already in the transfer list."});
            return;
        }

        setTransferItems(prev => [...prev, { sku: itemSku, productId: product.id, name: product.name, quantity: itemQuantity }]);
        setItemSku('');
        setItemQuantity(1);
    };

    const handleRemoveItem = (sku: string) => {
        setTransferItems(prev => prev.filter(item => item.sku !== sku));
    };
    
    const handleCompleteTransfer = async () => {
        if(transferItems.length === 0) {
             toast({ variant: 'destructive', title: 'Error', description: "Please add items to transfer."});
            return;
        }

        let updatedInventoryItems: InventoryItem[] = [];

        transferItems.forEach(item => {
            const fromInventory = inventory.find(i => i.productId === item.productId && i.storeId === fromStoreId);
            const toInventory = inventory.find(i => i.productId === item.productId && i.storeId === toStoreId);

            if (fromInventory) {
                updatedInventoryItems.push({
                    ...fromInventory,
                    stock: fromInventory.stock - item.quantity
                });
            }

            if (toInventory) {
                updatedInventoryItems.push({
                    ...toInventory,
                    stock: toInventory.stock + item.quantity
                });
            } else {
                 updatedInventoryItems.push({ 
                    productId: item.productId, 
                    storeId: toStoreId, 
                    stock: item.quantity 
                });
            }
        });

        await updateInventory(updatedInventoryItems);
        
        toast({ title: 'Success', description: "Stock transfer completed successfully."});
        setTransferItems([]);
        setFromStoreId('');
        setToStoreId('');
    };

  return (
    <div>
      <PageHeader title="Stock Transfer" />
      <Card className="bg-shiny-pink rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Transfer Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>From Store</Label>
              <Select value={fromStoreId} onValueChange={setFromStoreId} disabled={transferItems.length > 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Store</Label>
              <Select value={toStoreId} onValueChange={setToStoreId} disabled={transferItems.length > 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Items to Transfer</h3>
            <div className="space-y-4">
                <div className="flex items-end gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="sku">Item SKU</Label>
                        <Input id="sku" placeholder="Enter SKU" value={itemSku} onChange={(e) => setItemSku(e.target.value)} />
                    </div>
                    <div className="w-24 space-y-2">
                        <Label htmlFor="qty">Quantity</Label>
                        <Input id="qty" type="number" placeholder="Qty" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))}/>
                    </div>
                    <Button variant="outline" onClick={handleAddItem}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add Item
                    </Button>
                </div>
            </div>
          </div>

        {transferItems.length > 0 && (
            <div className="rounded-md border mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                             <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {transferItems.map(item => (
                           <TableRow key={item.sku}>
                               <TableCell>{item.sku}</TableCell>
                               <TableCell className="font-medium">{item.name}</TableCell>
                               <TableCell className="text-right">{item.quantity}</TableCell>
                               <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.sku)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                           </TableRow>
                       ))}
                    </TableBody>
                </Table>
            </div>
        )}

        </CardContent>
        <CardFooter className="flex justify-end">
          <Button size="lg" onClick={handleCompleteTransfer}>Complete Transfer</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
