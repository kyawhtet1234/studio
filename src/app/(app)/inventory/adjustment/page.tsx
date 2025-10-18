
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/data-context';
import type { Store, Product, InventoryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/app/page-header';

const formSchema = z.object({
  storeId: z.string().min(1, 'Please select a store.'),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      name: z.string(),
      sku: z.string(),
      variant_name: z.string(),
      newStock: z.coerce.number().min(0, 'Stock cannot be negative.'),
    })
  ).min(1, 'Please add items to adjust.'),
});

type AdjustmentFormValues = z.infer<typeof formSchema>;

export default function StockAdjustmentPage() {
  const { products, stores, inventory, updateInventory } = useData();
  const { toast } = useToast();

  const [sku, setSku] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: '',
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchStoreId = form.watch('storeId');
  const isFormLocked = fields.length > 0;

  const currentItemDetails = useMemo(() => {
    if (!foundProduct || !watchStoreId) return null;

    const variantName = foundProduct.variant_track_enabled ? selectedVariant : '';
    if (foundProduct.variant_track_enabled && !variantName) return null;

    const inventoryId = `${foundProduct.id}_${variantName}_${watchStoreId}`;
    const inventoryItem = inventory.find(i => i.id === inventoryId);
    
    return {
        name: foundProduct.name,
        variant_name: variantName,
        currentStock: inventoryItem?.stock ?? 0
    };
  }, [foundProduct, selectedVariant, watchStoreId, inventory]);

  useEffect(() => {
    if (sku) {
      const product = products.find(p => p.sku.toLowerCase().startsWith(sku.toLowerCase()));
      setFoundProduct(product || null);
      if (product && !product.variant_track_enabled) {
        setSelectedVariant('');
      }
    } else {
      setFoundProduct(null);
      setSelectedVariant('');
    }
  }, [sku, products]);

  function addItemToAdjustmentList() {
    if (!foundProduct || !currentItemDetails) {
      toast({ variant: 'destructive', title: 'Invalid Item', description: 'Please select a valid item and variant.' });
      return;
    }

    const isAlreadyInList = fields.some(
      item => item.productId === foundProduct.id && item.variant_name === currentItemDetails.variant_name
    );

    if (isAlreadyInList) {
      toast({ variant: 'destructive', title: 'Duplicate Item', description: 'This item is already in the adjustment list.' });
      return;
    }

    const inventoryId = `${foundProduct.id}_${currentItemDetails.variant_name}_${watchStoreId}`;

    append({
      id: inventoryId,
      productId: foundProduct.id,
      sku: foundProduct.sku,
      name: currentItemDetails.name,
      variant_name: currentItemDetails.variant_name,
      newStock: currentItemDetails.currentStock,
    });

    setSku('');
    setFoundProduct(null);
    setSelectedVariant('');
  }

  async function onSubmit(data: AdjustmentFormValues) {
    const itemsToUpdate: InventoryItem[] = data.items.map(item => ({
        id: item.id,
        productId: item.productId,
        storeId: data.storeId,
        variant_name: item.variant_name,
        stock: item.newStock
    }));
    
    try {
        await updateInventory(itemsToUpdate);
        toast({ title: 'Stock Adjusted', description: 'Inventory levels have been successfully updated.' });
        form.reset();
        remove();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Adjustment Failed', description: (error as Error).message });
    }
  }

  return (
    <div>
      <PageHeader title="Bulk Stock Adjustment" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-shiny-pink rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle>Adjustment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isFormLocked}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the store to adjust inventory" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className={cn('pt-4 border-t', !watchStoreId && 'opacity-50 pointer-events-none')}>
                <div className="flex flex-col sm:flex-row flex-wrap items-end gap-4">
                  <div className="w-full sm:w-auto sm:max-w-[150px] space-y-2">
                    <Label htmlFor="sku-input">SKU</Label>
                    <Input id="sku-input" placeholder="Enter SKU..." value={sku} onChange={(e) => setSku(e.target.value)} />
                  </div>
                  <div className="flex-grow w-full sm:w-auto min-w-[150px] space-y-2">
                    <Label>Item Name</Label>
                    <Input placeholder="Item name" value={currentItemDetails?.name || ''} readOnly />
                  </div>
                  {foundProduct?.variant_track_enabled && (
                    <div className="w-full sm:w-[150px] space-y-2">
                      <Label>Variant</Label>
                      <Select onValueChange={setSelectedVariant} value={selectedVariant}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {foundProduct.available_variants.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="w-full sm:w-32 space-y-2">
                    <Label>Current Stock</Label>
                    <Input value={currentItemDetails?.currentStock ?? ''} readOnly />
                  </div>
                  <div className="w-full sm:w-auto">
                    <Button type="button" className="w-full" onClick={addItemToAdjustmentList}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add to List
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-shiny-orange rounded-xl shadow-lg">
             <CardHeader>
              <CardTitle>Items to Adjust</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] text-black">SKU</TableHead>
                      <TableHead className="text-black">Item Name</TableHead>
                      <TableHead className="text-black">Variant</TableHead>
                      <TableHead className="w-40 text-right text-black">New Stock Quantity</TableHead>
                      <TableHead className="w-[50px] text-black"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length > 0 ? (
                      fields.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.variant_name || '-'}</TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.newStock`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" className="w-32 text-right ml-auto" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No items added for adjustment.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
           {form.formState.errors.items && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message || form.formState.errors.items.root?.message}</p>
            )}
          <div className="flex justify-end">
            <Button type="submit" size="lg">Complete Adjustment</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
