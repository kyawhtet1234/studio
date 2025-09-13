
"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { autofillPurchaseAction } from "@/app/(app)/purchase/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, PurchaseTransaction, Product } from "@/lib/types";
import { useData } from "@/lib/data-context";


const formSchema = z.object({
  storeId: z.string().min(1, "Please select a store."),
  sku: z.string(),
  itemName: z.string(),
  supplierName: z.string(),
  buyPrice: z.coerce.number(),
  quantity: z.coerce.number().min(1, "Min 1"),
  cart: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      sku: z.string(),
      buyPrice: z.number(),
      quantity: z.number(),
      total: z.number(),
    })
  ),
});

type PurchaseFormValues = z.infer<typeof formSchema>;

interface PurchaseFormProps {
    stores: Store[];
    onSavePurchase: (purchase: Omit<PurchaseTransaction, 'id' | 'date'>) => void;
}

export function PurchaseForm({ stores, onSavePurchase }: PurchaseFormProps) {
  const { products, suppliers } = useData();
  const [autofillState, setAutofillState] = useState({ message: "", data: null });
  const [isAutofillPending, startAutofillTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: "",
      sku: "",
      itemName: "",
      supplierName: "",
      buyPrice: 0,
      quantity: 1,
      cart: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cart",
  });

  const watchSku = form.watch("sku");
  const watchCart = form.watch("cart");

  useEffect(() => {
    if (watchSku.length > 3) {
      const formData = new FormData();
      formData.append("sku", watchSku);
      startAutofillTransition(async () => {
        const result = await autofillPurchaseAction(autofillState, formData);
        if (result.data) {
          form.setValue("itemName", result.data.itemName, { shouldValidate: true });
          form.setValue("supplierName", result.data.supplierName, { shouldValidate: true });
          form.setValue("buyPrice", result.data.buyPrice, { shouldValidate: true });
        } else if (result.message && result.message !== 'Success') {
          toast({ variant: 'destructive', title: 'Autofill Error', description: result.message });
        }
      });
    }
  }, [watchSku, form, toast]);

  function addToCart() {
    const { sku, itemName, buyPrice, quantity } = form.getValues();
    const product = products.find(p => p.sku === sku);

    if (product && itemName && buyPrice > 0 && quantity > 0) {
      const newItem = {
        productId: product.id,
        sku,
        name: itemName,
        buyPrice,
        quantity,
        total: buyPrice * quantity,
      };
      append(newItem);
      form.resetField("sku");
      form.resetField("itemName");
      form.resetField("supplierName");
      form.resetField("buyPrice");
      form.setValue("quantity", 1);
    } else {
        toast({ variant: 'destructive', title: 'Invalid Item', description: 'Please fill all item details before adding to cart.' });
    }
  }

  const total = watchCart.reduce((acc, item) => acc + item.total, 0);
  
  function onSubmit(data: PurchaseFormValues) {
    if (data.cart.length === 0) {
        toast({ variant: 'destructive', title: 'Empty Cart', description: 'Please add items to the cart before saving.' });
        return;
    }
    const supplier = suppliers.find(s => s.name === data.cart[0].name);

    const purchaseData = {
      storeId: data.storeId,
      supplierId: supplier?.id || 'sup-unknown',
      items: data.cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        buyPrice: item.buyPrice,
      })),
      total: total
    }
    
    onSavePurchase(purchaseData);

    toast({ title: 'Purchase Saved!', description: `Total: MMK ${total.toFixed(2)}` });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
             <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select the store receiving stock" />
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-2 relative">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {isAutofillPending && <Loader2 className="absolute top-9 right-2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="md:col-span-3">
                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="buyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-1">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="button" className="w-full" onClick={addToCart}>
                  <PlusCircle className="mr-2" /> Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[120px]">SKU</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.length > 0 ? (
                        fields.map((item, index) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">MMK {item.buyPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">MMK {item.total.toFixed(2)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">Cart is empty</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6 bg-muted/50 flex flex-col items-end space-y-4">
            <div className="flex justify-between w-full max-w-sm border-t pt-4">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-primary">MMK {total.toFixed(2)}</span>
            </div>
          </CardFooter>
        </Card>

        <div className="flex justify-end">
            <Button type="submit" size="lg">Save Purchase</Button>
        </div>
      </form>
    </Form>
  );
}
