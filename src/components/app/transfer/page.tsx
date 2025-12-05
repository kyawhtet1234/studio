

'use client';

import { useState, useEffect } from "react";
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
import type { InventoryItem, Product } from "@/lib/types";
import { useData } from "@/lib/data-context";

interface TransferItem {
    productId: string;
    name: string;
    sku: string;
    variant_name: string;
    quantity: number;
}

export default function TransferPage() {
    const { toast } = useToast();
    const { stores, products, inventory, updateInventory } = useData();
    const [fromStoreId, setFromStoreId] = useState<string>('');
    const [toStoreId, setToStoreId] = useState<string>('');
    const [itemSku, setItemSku] = useState('');
    const [itemName, setItemName] = useState('');
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [itemQuantity, setItemQuantity] = useState<number | string>(1);
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<string>('');

    useEffect(() => {
        if (itemSku) {
            const product = products.find(p => p.sku.toLowerCase().startsWith(itemSku.toLowerCase()));
            if (product) {
                setItemName(product.name);
                setFoundProduct(product);
                if (!product.variant_track_enabled) {
                    setSelectedVariant("");
                }
            } else {
                setItemName('');
                setFoundProduct(null);
                setSelectedVariant('');
            }
        } else {
            setItemName('');
            setFoundProduct(null);
            setSelectedVariant('');
        }
    }, [itemSku, products]);

    const handleAddItem = () => {
        if (!fromStoreId || !toStoreId) {
            toast({ variant: 'destructive', title: 'Error', description: "Please select 'From' and 'To' stores."});
            return;
        }
        if (fromStoreId === toStoreId) {
            toast({ variant: 'destructive', title: 'Error', description: "Source and destination stores cannot be the same."});
            return;
        }
        if (!foundProduct) {
            toast({ variant: 'destructive', title: 'Error', description: "Product with this SKU not found."});
            return;
        }
        if (foundProduct.variant_track_enabled && !selectedVariant) {
            toast({ variant: 'destructive', title: 'Error', description: "Please select a variant for this item."});
            return;
        }

        const currentQuantity = Number(itemQuantity);
        if (currentQuantity <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: "Please enter a valid quantity."});
            return;
        }

        const variantName = foundProduct.variant_track_enabled ? selectedVariant : "";
        const inventoryId = `${foundProduct.id}_${variantName}_${fromStoreId}`;
        const sourceInventory = inventory.find(i => i.id === inventoryId);
        
        if (!sourceInventory || sourceInventory.stock < currentQuantity) {
            toast({ variant: 'destructive', title: 'Error', description: `Not enough stock in ${stores.find(s=>s.id === fromStoreId)?.name}. Available: ${sourceInventory?.stock || 0}`});
            return;
        }
        
        const uniqueItemIdentifier = `${foundProduct.sku}_${variantName}`;
        if (transferItems.find(item => `${item.sku}_${item.variant_name}` === uniqueItemIdentifier)) {
            toast({ variant: 'destructive', title: 'Error', description: "Item is already in the transfer list."});
            return;
        }

        setTransferItems(prev => [...prev, { 
            sku: foundProduct.sku, 
            productId: foundProduct.id, 
            name: foundProduct.name,
            variant_name: variantName,
            quantity: currentQuantity 
        }]);
        
        setItemSku('');
        setItemName('');
        setFoundProduct(null);
        setItemQuantity(1);
        setSelectedVariant('');
    };

    const handleRemoveItem = (sku: string, variant_name: string) => {
        const uniqueItemIdentifier = `${sku}_${variant_name}`;
        setTransferItems(prev => prev.filter(item => `${item.sku}_${item.variant_name}` !== uniqueItemIdentifier));
    };
    
    const handleCompleteTransfer = async () => {
        if(transferItems.length === 0) {
             toast({ variant: 'destructive', title: 'Error', description: "Please add items to transfer."});
            return;
        }

        let updatedInventoryItems: InventoryItem[] = [];

        for (const item of transferItems) {
            const variantName = item.variant_name || "";
            const fromInventoryId = `${item.productId}_${variantName}_${fromStoreId}`;
            const toInventoryId = `${item.productId}_${variantName}_${toStoreId}`;

            const fromInventory = inventory.find(i => i.id === fromInventoryId);
            const toInventory = inventory.find(i => i.id === toInventoryId);

            if (fromInventory) {
                updatedInventoryItems.push({
                    id: fromInventoryId,
                    productId: item.productId,
                    variant_name: variantName,
                    storeId: fromStoreId,
                    stock: fromInventory.stock - item.quantity
                });
            }

            updatedInventoryItems.push({
                id: toInventoryId,
                productId: item.productId,
                variant_name: variantName,
                storeId: toStoreId,
                stock: (toInventory?.stock || 0) + item.quantity
            });
        }

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
                <div className="flex flex-col sm:flex-row flex-wrap items-end gap-4 p-4 border rounded-lg">
                    <div className="w-full sm:w-auto sm:max-w-[150px] space-y-2">
                        <Label htmlFor="sku">Item SKU</Label>
                        <Input id="sku" placeholder="Enter SKU" value={itemSku} onChange={(e) => setItemSku(e.target.value)} />
                    </div>
                     <div className="flex-grow w-full sm:w-auto min-w-[150px] space-y-2">
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input id="item-name" placeholder="Item name will appear here" value={itemName} readOnly />
                    </div>
                    {foundProduct && foundProduct.variant_track_enabled && (
                        <div className="w-full sm:w-[150px] space-y-2 min-h-[70px]">
                            <Label>Variant</Label>
                             <Select onValueChange={setSelectedVariant} value={selectedVariant}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select Variant" />
                                </SelectTrigger>
                                <SelectContent>
                                {foundProduct.available_variants.map(variant => (
                                    <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="w-full sm:w-24 space-y-2">
                        <Label htmlFor="qty">Quantity</Label>
                        <Input id="qty" type="number" placeholder="Qty" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))}/>
                    </div>
                    <Button type="button" variant="outline" onClick={handleAddItem}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add Item
                    </Button>
                </div>
            </div>
          </div>

        {transferItems.length > 0 && (
            <div className="rounded-md border mt-6 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                             <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {transferItems.map(item => (
                           <TableRow key={`${item.sku}_${item.variant_name}`}>
                               <TableCell>{item.sku}</TableCell>
                               <TableCell className="font-medium">{item.name}</TableCell>
                               <TableCell>{item.variant_name || '-'}</TableCell>
                               <TableCell className="text-right">{item.quantity}</TableCell>
                               <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.sku, item.variant_name)}>
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

    
