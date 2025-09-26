
'use client';

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Trash2, PlusCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, SaleTransaction, Store, Product, Customer, PaymentType } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { Receipt } from "./receipt";
import { AddCustomerForm } from "@/components/app/products/forms";


const formSchema = z.object({
  storeId: z.string().min(1, "Please select a store."),
  customerId: z.string().optional(),
  paymentType: z.string().min(1, "Please select a payment type."),
  cart: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      sku: z.string(),
      sellPrice: z.number(),
      quantity: z.number(),
      total: z.number(),
    })
  ).min(1, "Cart cannot be empty."),
  discount: z.coerce.number().min(0).optional(),
});

type SalesFormValues = z.infer<typeof formSchema>;

interface SalesFormProps {
    stores: Store[];
    customers: Customer[];
    onSave: (sale: Omit<SaleTransaction, 'id' | 'date' | 'status'>) => Promise<void>;
    onAddCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
}

export function SalesForm({ stores, customers, onSave, onAddCustomer }: SalesFormProps) {
  const { products, inventory, paymentTypes } = useData();
  const { toast } = useToast();
  const [lastSale, setLastSale] = useState<SaleTransaction | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // State for temporary item inputs
  const [sku, setSku] = useState("");
  const [itemName, setItemName] = useState("");
  const [sellPrice, setSellPrice] = useState<number | string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: "",
      customerId: "",
      paymentType: "",
      cart: [],
      discount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cart",
  });

  const watchCart = form.watch("cart");
  const watchDiscount = form.watch("discount");
  const watchStoreId = form.watch("storeId");

  useEffect(() => {
    if (sku) {
        const product = products.find(p => p.sku.toLowerCase().startsWith(sku.toLowerCase()));
        if (product) {
            setItemName(product.name);
            setSellPrice(product.sellPrice);
            setFoundProduct(product);
        } else {
            setItemName("");
            setSellPrice("");
            setFoundProduct(null);
        }
    } else {
        setItemName("");
        setSellPrice("");
        setFoundProduct(null);
    }
  }, [sku, products]);


  function addToCart() {
    const currentPrice = Number(sellPrice);
    const currentQuantity = Number(quantity);

    if (!watchStoreId) {
        toast({ variant: 'destructive', title: 'Error', description: "Please select a store first." });
        return;
    }
    
    if (foundProduct && itemName && currentPrice > 0 && currentQuantity > 0) {
      const inventoryItem = inventory.find(i => i.productId === foundProduct.id && i.storeId === watchStoreId);
      const availableStock = inventoryItem?.stock || 0;

      if(availableStock < currentQuantity) {
        toast({ variant: 'destructive', title: 'Not enough stock', description: `Only ${availableStock} of ${itemName} available.` });
        return;
      }

      const newItem: CartItem = {
        productId: foundProduct.id,
        sku: foundProduct.sku,
        name: itemName,
        sellPrice: currentPrice,
        quantity: currentQuantity,
        total: currentPrice * currentQuantity,
      };
      append(newItem);
      
      // Reset temporary inputs
      setSku("");
      setItemName("");
      setSellPrice("");
      setQuantity(1);
      setFoundProduct(null);
      
      // Focus SKU input for next item
      document.getElementById('sku-input')?.focus();
    } else {
        toast({ variant: 'destructive', title: 'Invalid Item', description: 'Please fill all item details before adding to cart.' });
    }
  }

  const subtotal = watchCart.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal - (watchDiscount || 0);
  
  async function onSubmit(data: SalesFormValues) {
    const saleData: Omit<SaleTransaction, 'id' | 'date' | 'status'> = {
        storeId: data.storeId,
        customerId: data.customerId,
        paymentType: data.paymentType,
        items: data.cart.map(item => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            sellPrice: item.sellPrice,
            quantity: item.quantity,
            total: item.total
        })),
        subtotal: subtotal,
        discount: data.discount || 0,
        total: total,
    };
    
    try {
      await onSave(saleData);

      const completeSaleData: SaleTransaction = {
        ...saleData,
        id: `sale-${Date.now()}`,
        date: new Date(),
        status: 'completed'
      }

      setLastSale(completeSaleData);
      
      toast({ title: 'Sale Saved!', description: `Total: MMK ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
      form.reset();
      remove(); // Clears the useFieldArray
    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'Sale Failed',
        description: (error as Error).message,
      });
    }
  }

  const handleCloseReceipt = () => {
    setLastSale(null);
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
             <CardTitle>Sale Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Store</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select the store for this sale" />
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
                 <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a customer (optional)" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsAddCustomerOpen(true)}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a payment type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {paymentTypes.map(pt => (
                            <SelectItem key={pt.id} value={pt.name}>{pt.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-4 border-t">
              <div className="md:col-span-3 relative space-y-2">
                  <Label htmlFor="sku-input">SKU</Label>
                  <Input 
                    id="sku-input" 
                    placeholder="Enter SKU..." 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value)} 
                  />
              </div>
              <div className="md:col-span-4 space-y-2">
                  <Label htmlFor="itemName-input">Item Name</Label>
                  <Input 
                    id="itemName-input"
                    placeholder="Item name"
                    value={itemName}
                    readOnly
                  />
              </div>
              <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="sellPrice-input">Sell Price</Label>
                  <Input
                    id="sellPrice-input"
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    readOnly
                  />
              </div>
              <div className="md:col-span-1 space-y-2">
                  <Label htmlFor="quantity-input">Qty</Label>
                  <Input 
                    id="quantity-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
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
                                <TableCell className="text-right">MMK {item.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">MMK {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
            <div className="flex justify-between w-full max-w-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">MMK {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center w-full max-w-sm">
                <FormLabel htmlFor="discount">Discount</FormLabel>
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input id="discount" type="number" step="0.01" className="w-32" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>
            <div className="flex justify-between w-full max-w-sm border-t pt-4">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-primary">MMK {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </CardFooter>
        </Card>
        {form.formState.errors.cart && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.cart.message || form.formState.errors.cart.root?.message}</p>
        )}
        <div className="flex justify-end">
            <Button type="submit" size="lg">Save Transaction</Button>
        </div>
      </form>
    </Form>

    <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add a new customer</DialogTitle>
            </DialogHeader>
            <AddCustomerForm onSave={onAddCustomer} onSuccess={() => setIsAddCustomerOpen(false)} />
        </DialogContent>
    </Dialog>

    <Dialog open={!!lastSale} onOpenChange={handleCloseReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <Receipt
              sale={lastSale}
              store={stores.find((s) => s.id === lastSale.storeId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
