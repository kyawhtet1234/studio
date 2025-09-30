
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, PlusCircle, UserPlus, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem, SaleTransaction, Store, Product, Customer } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { AddCustomerForm } from "@/components/app/products/forms";
import { InvoiceOrQuotation } from "./invoice-quotation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


const formSchema = z.object({
  storeId: z.string().min(1, "Please select a store."),
  customerId: z.string().optional(),
  date: z.date(),
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

type DocumentFormValues = z.infer<typeof formSchema>;

interface DocumentFormProps {
    type: 'invoice' | 'quotation';
    stores: Store[];
    customers: Customer[];
    onSave: (sale: Omit<SaleTransaction, 'id'>) => Promise<void>;
    onAddCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
    sale?: SaleTransaction;
    onSuccess: () => void;
}

export function DocumentForm({ type, stores, customers, onSave, onAddCustomer, sale, onSuccess }: DocumentFormProps) {
  const { products, inventory } = useData();
  const { toast } = useToast();
  const [generatedDocument, setGeneratedDocument] = useState<SaleTransaction | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const [sku, setSku] = useState("");
  const [itemName, setItemName] = useState("");
  const [sellPrice, setSellPrice] = useState<number | string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);

  const isEditMode = !!sale;

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: sale?.storeId || "",
      customerId: sale?.customerId || "",
      date: sale ? (sale.date as Date) : new Date(),
      cart: sale?.items || [],
      discount: sale?.discount || 0,
    },
  });

  useEffect(() => {
    if (sale) {
        form.reset({
            storeId: sale.storeId,
            customerId: sale.customerId,
            date: sale.date as Date,
            cart: sale.items,
            discount: sale.discount,
        })
    }
  }, [sale, form]);


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
      // For invoices, check stock. For quotations, don't.
      if (type === 'invoice') {
        const inventoryItem = inventory.find(i => i.productId === foundProduct.id && i.storeId === watchStoreId);
        const availableStock = inventoryItem?.stock || 0;
        if(availableStock < currentQuantity) {
          toast({ variant: 'destructive', title: 'Not enough stock', description: `Only ${availableStock} of ${itemName} available.` });
          return;
        }
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
      
      setSku("");
      setItemName("");
      setSellPrice("");
      setQuantity(1);
      setFoundProduct(null);
      
      document.getElementById(`sku-input-${type}`)?.focus();
    } else {
        toast({ variant: 'destructive', title: 'Invalid Item', description: 'Please fill all item details before adding to cart.' });
    }
  }

  const subtotal = watchCart.reduce((acc, item) => acc + item.total, 0);
  const total = subtotal - (watchDiscount || 0);
  
  async function onSubmit(data: DocumentFormValues) {
    const docData: Omit<SaleTransaction, 'id'> = {
        storeId: data.storeId,
        customerId: data.customerId,
        date: data.date,
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
        status: type, // Set status to 'invoice' or 'quotation'
        paymentType: type === 'invoice' ? 'Invoice' : 'Quotation' // Differentiate payment type
    };
    
    try {
      await onSave(docData);
      const toastTitle = isEditMode ? `${type.charAt(0).toUpperCase() + type.slice(1)} Updated` : `${type.charAt(0).toUpperCase() + type.slice(1)} Generated`;

      if (!isEditMode) {
        const completeDocData: SaleTransaction = {
          ...docData,
          id: `${type}-${Date.now()}`,
          date: new Date(),
        }
        setGeneratedDocument(completeDocData);
      }
      
      toast({ title: toastTitle, description: `Total: MMK ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
      
      if (onSuccess) {
          onSuccess();
      } else {
        form.reset();
        remove();
      }

    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: (error as Error).message,
      });
    }
  }

  const handleCloseDialog = () => {
    setGeneratedDocument(null);
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-shiny-blue rounded-xl shadow-lg">
          <CardHeader>
             <CardTitle className="capitalize">{isEditMode ? 'Edit' : 'New'} {type}</CardTitle>
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
                            <SelectValue placeholder="Select the store" />
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
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
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
            <div className="flex flex-col sm:flex-row flex-wrap items-end gap-4 pt-4 border-t">
              <div className="flex-grow w-full sm:w-auto min-w-[120px] space-y-2">
                  <Label htmlFor={`sku-input-${type}`}>SKU</Label>
                  <Input 
                    id={`sku-input-${type}`} 
                    placeholder="Enter SKU..." 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value)} 
                  />
              </div>
              <div className="flex-grow w-full sm:w-auto min-w-[150px] space-y-2">
                  <Label htmlFor={`itemName-input-${type}`}>Item Name</Label>
                  <Input 
                    id={`itemName-input-${type}`}
                    placeholder="Item name"
                    value={itemName}
                    readOnly
                  />
              </div>
              <div className="w-full sm:w-32 space-y-2">
                  <Label htmlFor={`sellPrice-input-${type}`}>Sell Price</Label>
                  <Input
                    id={`sellPrice-input-${type}`}
                    type="number"
                    step="0.01"
                    value={sellPrice}
                    readOnly
                  />
              </div>
              <div className="w-full sm:w-20 space-y-2">
                  <Label htmlFor={`quantity-input-${type}`}>Qty</Label>
                  <Input 
                    id={`quantity-input-${type}`}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
              </div>
              <div className="w-full sm:w-auto sm:flex-grow-0">
                <Button type="button" className="w-full" onClick={addToCart}>
                  <PlusCircle className="mr-2" /> Add Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-shiny-green rounded-xl shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[120px] text-black">SKU</TableHead>
                        <TableHead className="text-black">Item Name</TableHead>
                        <TableHead className="text-right text-black">Price</TableHead>
                        <TableHead className="text-right text-black">Qty</TableHead>
                        <TableHead className="text-right text-black">Total</TableHead>
                        <TableHead className="w-[50px] text-black"></TableHead>
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
                                <TableCell colSpan={6} className="text-center h-24">No items added</TableCell>
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
            <Button type="submit" size="lg" className="capitalize">{isEditMode ? 'Save Changes' : `Generate ${type}`}</Button>
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

    {!isEditMode && 
      <Dialog open={!!generatedDocument} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="capitalize">{type} Generated</DialogTitle>
            </DialogHeader>
            {generatedDocument && (
              <InvoiceOrQuotation 
                type={type}
                sale={generatedDocument}
                store={stores.find((s) => s.id === generatedDocument.storeId)}
                customer={customers.find((c) => c.id === generatedDocument.customerId)}
              />
            )}
          </DialogContent>
        </Dialog>
    }
    </>
  );
}

    

    

    
    