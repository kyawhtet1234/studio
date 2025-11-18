
"use client";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Trash2, PlusCircle, UserPlus, CalendarIcon, ScanBarcode, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, SaleTransaction, Store, Product, Customer, PaymentType } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { Receipt } from "./receipt";
import { AddCustomerForm } from "@/components/app/products/forms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BarcodeScanner } from "./barcode-scanner";


const formSchema = z.object({
  storeId: z.string().min(1, "Please select a store."),
  customerId: z.string().optional(),
  paymentType: z.string().min(1, "Please select a payment type."),
  date: z.date(),
  cart: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      sku: z.string(),
      variant_name: z.string(),
      sellPrice: z.number(),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
      total: z.number(),
      cogs: z.number().optional(),
      sourcedQuantity: z.number().optional(),
      sourceCost: z.number().optional(),
    })
  ).min(1, "Cart cannot be empty."),
  discount: z.coerce.number().min(0).optional(),
});

type SalesFormValues = z.infer<typeof formSchema>;

interface SpecialOrderState {
  product: Product;
  totalQuantity: number;
  inStockQuantity: number;
  sourceCost: string;
}

interface SalesFormProps {
    stores: Store[];
    customers: Customer[];
    onSave: (sale: Omit<SaleTransaction, 'id' | 'status'>) => Promise<string | void>;
    onAddCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
}

export function SalesForm({ stores, customers, onSave, onAddCustomer }: SalesFormProps) {
  const { products, inventory, paymentTypes, sales: allSales } = useData();
  const { toast } = useToast();
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [specialOrderState, setSpecialOrderState] = useState<SpecialOrderState | null>(null);

  const [sku, setSku] = useState("");
  const [itemName, setItemName] = useState("");
  const [sellPrice, setSellPrice] = useState<number | string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: "",
      customerId: "",
      paymentType: "",
      date: new Date(),
      cart: [],
      discount: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "cart",
  });

  const watchCart = form.watch("cart");
  const watchDiscount = form.watch("discount");
  const watchStoreId = form.watch("storeId");

  const subtotal = watchCart.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal - (watchDiscount || 0);

  useEffect(() => {
    if (sku) {
        const product = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
        if (product) {
            setItemName(product.name);
            setSellPrice(product.sellPrice);
            setFoundProduct(product);
            if (!product.variant_track_enabled) {
                setSelectedVariant('');
            }
        } else {
            setItemName("");
            setSellPrice("");
            setFoundProduct(null);
            setSelectedVariant('');
        }
    } else {
        setItemName("");
        setSellPrice("");
        setFoundProduct(null);
        setSelectedVariant('');
    }
  }, [sku, products]);

  const clearItemInput = () => {
    setSku("");
    setItemName("");
    setSellPrice("");
    setQuantity(1);
    setFoundProduct(null);
    setSelectedVariant('');
  };

  function addToCart() {
    if (!watchStoreId) {
        toast({ variant: 'destructive', title: 'Error', description: "Please select a store first." });
        return;
    }
    
    if (foundProduct) {
      const currentPrice = Number(sellPrice);
      const currentQuantity = Number(quantity);

      if (foundProduct.variant_track_enabled && !selectedVariant) {
        toast({ variant: 'destructive', title: 'Variant Required', description: `Please select a variant for ${foundProduct.name}.` });
        return;
      }

      const variantName = foundProduct.variant_track_enabled ? selectedVariant : "";
      const inventoryId = `${foundProduct.id}_${variantName}_${watchStoreId}`;
      const inventoryItem = inventory.find(i => i.id === inventoryId);
      const availableStock = inventoryItem?.stock || 0;

      if(availableStock < currentQuantity) {
        setSpecialOrderState({
          product: foundProduct,
          totalQuantity: currentQuantity,
          inStockQuantity: availableStock,
          sourceCost: ''
        });
        return;
      }

      const newItem: CartItem = {
        productId: foundProduct.id,
        sku: foundProduct.sku,
        name: foundProduct.name,
        variant_name: variantName,
        sellPrice: currentPrice,
        quantity: currentQuantity,
        total: currentPrice * currentQuantity,
        cogs: foundProduct.buyPrice * currentQuantity,
      };
      append(newItem);
      clearItemInput();
      document.getElementById('sku-input')?.focus();
    } else {
        toast({ variant: 'destructive', title: 'Invalid Item', description: 'Please fill all item details before adding to cart.' });
    }
  }

  const handleConfirmSpecialOrder = () => {
    if (!specialOrderState || !foundProduct) return;

    const sourceCost = parseFloat(specialOrderState.sourceCost);
    if (isNaN(sourceCost) || sourceCost <= 0) {
      toast({ variant: "destructive", title: "Invalid Source Cost" });
      return;
    }

    const { product, totalQuantity, inStockQuantity } = specialOrderState;
    const sourcedQuantity = totalQuantity - inStockQuantity;
    const blendedCogs = (inStockQuantity * product.buyPrice) + (sourcedQuantity * sourceCost);
    
    const newItem: CartItem = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        variant_name: selectedVariant || "",
        sellPrice: Number(sellPrice),
        quantity: totalQuantity,
        total: Number(sellPrice) * totalQuantity,
        cogs: blendedCogs,
        sourcedQuantity: sourcedQuantity,
        sourceCost: sourceCost,
    };
    append(newItem);

    setSpecialOrderState(null);
    clearItemInput();
    document.getElementById('sku-input')?.focus();
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const item = fields[index];
    // Special order items cannot have their quantity changed in the cart.
    if(item.sourcedQuantity && item.sourcedQuantity > 0) {
        toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'Remove and re-add special order items to change quantity.'});
        return;
    }
    const variantName = item.variant_name || "";
    const inventoryId = `${item.productId}_${variantName}_${watchStoreId}`;
    const inventoryItem = inventory.find(i => i.id === inventoryId);
    const availableStock = inventoryItem?.stock || 0;

    if (newQuantity > availableStock) {
        toast({ variant: 'destructive', title: 'Not enough stock', description: `Only ${availableStock} of ${item.name} available.` });
        return;
    }

    if (newQuantity > 0) {
      update(index, { ...item, quantity: newQuantity, total: item.sellPrice * newQuantity });
    }
  };
  
  async function onSubmit(data: SalesFormValues) {
    if (isLoading) return;
    setIsLoading(true);

    const saleData: Omit<SaleTransaction, 'id' | 'status'> = {
        storeId: data.storeId,
        customerId: data.customerId || null,
        paymentType: data.paymentType,
        date: data.date,
        items: data.cart.map(item => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            variant_name: item.variant_name || "",
            sellPrice: item.sellPrice,
            quantity: item.quantity,
            total: item.total,
            cogs: item.cogs,
            sourceCost: item.sourceCost,
            sourcedQuantity: item.sourcedQuantity,
        })),
        subtotal: subtotal,
        discount: data.discount || 0,
        total: total,
        paidAmount: total,
        balance: 0,
    };
    
    try {
      const newSaleId = await onSave(saleData);
      
      toast({ 
          title: 'Sale Saved!',
          description: `Total: MMK ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
      
      if (newSaleId) {
        setLastSaleId(newSaleId as string);
      }
      
      form.reset();
      remove();
    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'Sale Failed',
        description: (error as Error).message,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const handleCloseReceipt = () => {
    setLastSaleId(null);
  }
  
  const handleBarcodeScan = (scannedSku: string) => {
    setSku(scannedSku);
    setIsScannerOpen(false);
  }
  
  const lastSale = allSales.find(s => s.id === lastSaleId);

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-shiny-yellow rounded-xl shadow-lg">
          <CardHeader>
             <CardTitle>Sale Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <Select onValueChange={field.onChange} value={field.value || ''} defaultValue="">
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
                 <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-end gap-2 pt-4 border-t">
              <div className="flex-auto space-y-2">
                  <Label htmlFor="sku-input">SKU</Label>
                  <div className="flex gap-2">
                    <Input 
                        id="sku-input" 
                        placeholder="Enter SKU..." 
                        value={sku} 
                        onChange={(e) => setSku(e.target.value)} 
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}>
                        <ScanBarcode className="h-4 w-4" />
                        <span className="sr-only">Scan Barcode</span>
                    </Button>
                  </div>
              </div>
              <div className="flex-auto space-y-2 min-w-[150px]">
                  <Label htmlFor="itemName-input">Item Name</Label>
                  <Input 
                    id="itemName-input"
                    placeholder="Item name"
                    value={itemName}
                    readOnly
                  />
              </div>
               <div className="flex-auto space-y-2 w-full sm:w-[150px] min-h-[70px]">
                  {foundProduct?.variant_track_enabled && (
                    <>
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
                    </>
                  )}
                </div>
              <div className="flex-auto space-y-2 w-full sm:w-32">
                  <Label htmlFor="sellPrice-input">Sell Price</Label>
                  <Input
                    id="sellPrice-input"
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                  />
              </div>
              <div className="flex-auto space-y-2 w-full sm:w-20">
                  <Label htmlFor="quantity-input">Qty</Label>
                  <Input 
                    id="quantity-input"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
              </div>
              <div className="flex-shrink-0 self-end w-full sm:w-auto">
                <Button type="button" className="w-full" onClick={addToCart}>
                  <PlusCircle className="mr-2" /> Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shiny-orange rounded-xl shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px] text-black">SKU</TableHead>
                        <TableHead className="text-black">Item Name</TableHead>
                        <TableHead className="text-black">Variant</TableHead>
                        <TableHead className="text-right text-black">Price</TableHead>
                        <TableHead className="w-24 text-right text-black">Qty</TableHead>
                        <TableHead className="text-right text-black">Total</TableHead>
                        <TableHead className="w-[50px] text-black"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.length > 0 ? (
                            fields.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell>
                                    {item.name}
                                    {item.sourcedQuantity && item.sourcedQuantity > 0 && (
                                        <span className="ml-2 text-xs text-blue-600 font-semibold">(Sourced)</span>
                                    )}
                                </TableCell>
                                <TableCell>{item.variant_name || '-'}</TableCell>
                                <TableCell className="text-right">MMK {item.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                      type="number"
                                      className="w-20 text-right ml-auto"
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                                  />
                                </TableCell>
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
                                <TableCell colSpan={7} className="text-center h-24">Cart is empty</TableCell>
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
             <div className="flex justify-between w-full max-w-sm font-bold text-lg border-t pt-4">
                <span>Total</span>
                <span className="text-primary">MMK {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </CardFooter>
        </Card>
        {form.formState.errors.cart && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.cart.message || form.formState.errors.cart.root?.message}</p>
        )}
        <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Transaction
            </Button>
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

    <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at a barcode to add the item to the cart.
          </DialogDescription>
        </DialogHeader>
        <BarcodeScanner onScan={handleBarcodeScan} />
      </DialogContent>
    </Dialog>

    <Dialog open={!!specialOrderState} onOpenChange={() => setSpecialOrderState(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Special Order / External Sourcing</DialogTitle>
                <DialogDescription>
                    The quantity requested exceeds available stock. Please enter the cost for the externally sourced items.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-4 rounded-md border bg-muted">
                    <p><strong>Item:</strong> {specialOrderState?.product.name}</p>
                    <p><strong>Total Quantity Requested:</strong> {specialOrderState?.totalQuantity}</p>
                    <p><strong>In-Stock Quantity:</strong> {specialOrderState?.inStockQuantity}</p>
                    <p className="font-semibold"><strong>Quantity to Source:</strong> {specialOrderState ? specialOrderState.totalQuantity - specialOrderState.inStockQuantity : 0}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="source-cost">Source Cost per Unit (MMK)</Label>
                    <Input 
                        id="source-cost"
                        type="number"
                        value={specialOrderState?.sourceCost || ''}
                        onChange={(e) => setSpecialOrderState(prev => prev ? {...prev, sourceCost: e.target.value} : null)}
                        placeholder="Cost from partner store"
                        autoFocus
                    />
                </div>
            </div>
            <DialogClose asChild>
                <Button variant="outline" onClick={() => setSpecialOrderState(null)}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleConfirmSpecialOrder}>Confirm & Add to Cart</Button>
        </DialogContent>
    </Dialog>

    <Dialog open={!!lastSaleId} onOpenChange={handleCloseReceipt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
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

