

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
import { Trash2, PlusCircle, CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Store, PurchaseTransaction, Supplier, Product } from "@/lib/types";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const formSchema = z.object({
  storeId: z.string().min(1, "Please select a store."),
  supplierId: z.string().min(1, "Please select a supplier."),
  date: z.date(),
  cart: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      sku: z.string(),
      variant_name: z.string(),
      buyPrice: z.number(),
      quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
      total: z.number(),
    })
  ).min(1, "Cart cannot be empty."),
});

type PurchaseFormValues = z.infer<typeof formSchema>;

interface PurchaseFormProps {
    stores: Store[];
    suppliers: Supplier[];
    onSavePurchase: (purchase: Omit<PurchaseTransaction, 'id'>) => Promise<void>;
}

export function PurchaseForm({ stores, suppliers, onSavePurchase }: PurchaseFormProps) {
  const { products } = useData();
  const { toast } = useToast();

  const [sku, setSku] = useState("");
  const [itemName, setItemName] = useState("");
  const [buyPrice, setBuyPrice] = useState<number | string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: "",
      supplierId: "",
      date: new Date(),
      cart: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "cart",
  });

  const watchCart = form.watch("cart");
  const watchSupplierId = form.watch("supplierId");

  useEffect(() => {
    if (sku) {
        const product = products.find(p => p.sku.toLowerCase().startsWith(sku.toLowerCase()));
        if (product) {
            setItemName(product.name);
            setBuyPrice(product.buyPrice);
            setFoundProduct(product);
            if (!product.variant_track_enabled) {
                setSelectedVariant('');
            }
        } else {
            setItemName("");
            setBuyPrice("");
            setFoundProduct(null);
            setSelectedVariant('');
        }
    } else {
        setItemName("");
        setBuyPrice("");
        setFoundProduct(null);
        setSelectedVariant('');
    }
  }, [sku, products]);


  function addToCart() {
    const currentPrice = Number(buyPrice);
    const currentQuantity = Number(quantity);
    const supplierId = form.getValues("supplierId");

    if (!foundProduct || !itemName || currentPrice <= 0 || currentQuantity <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Item', description: 'Please fill all item details correctly before adding to cart.' });
        return;
    }
    
    if (foundProduct.supplierId !== supplierId) {
        const supplier = suppliers.find(s => s.id === foundProduct.supplierId);
        toast({ variant: 'destructive', title: 'Wrong Supplier', description: `Item ${foundProduct.name} belongs to ${supplier?.name || 'another supplier'}.` });
        return;
    }

    if (foundProduct.variant_track_enabled && !selectedVariant) {
        toast({ variant: 'destructive', title: 'Variant Required', description: `Please select a variant for ${foundProduct.name}.` });
        return;
    }

      const variantName = foundProduct.variant_track_enabled ? selectedVariant : "";

      const newItem = {
        productId: foundProduct.id,
        sku: foundProduct.sku,
        name: foundProduct.name,
        variant_name: variantName,
        buyPrice: currentPrice,
        quantity: currentQuantity,
        total: currentPrice * currentQuantity,
      };
      append(newItem);
      
      setSku("");
      setItemName("");
      setBuyPrice("");
      setQuantity(1);
      setFoundProduct(null);
      setSelectedVariant('');

      document.getElementById('sku-input')?.focus();
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    const item = fields[index];
    if (newQuantity > 0) {
      update(index, { ...item, quantity: newQuantity, total: item.buyPrice * newQuantity });
    }
  };

  const total = watchCart.reduce((acc, item) => acc + item.total, 0);
  
  async function onSubmit(data: PurchaseFormValues) {
    if (data.cart.length === 0) {
      toast({ variant: "destructive", title: "Empty Cart", description: "Please add items to the cart before saving." });
      return;
    }
    
    setIsLoading(true);

    const purchaseData = {
      storeId: data.storeId,
      supplierId: data.supplierId, 
      date: data.date,
      items: data.cart.map(item => ({
        productId: item.productId,
        variant_name: item.variant_name || "",
        quantity: item.quantity,
        buyPrice: item.buyPrice,
      })),
      total: total,
    };
  
    try {
      await onSavePurchase(purchaseData);
      toast({ title: "Purchase Saved!", description: `Total: MMK ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
      form.reset();
      remove();
    } catch (error) {
      toast({ variant: 'destructive', title: "Save Failed", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }
  
  const isFormLocked = fields.length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-shiny-yellow rounded-xl shadow-lg">
          <CardHeader>
             <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Store</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isFormLocked}>
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
                <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isFormLocked}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select the supplier for this purchase" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
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
            <div className={cn("flex flex-col sm:flex-row flex-wrap items-end gap-2 pt-4 border-t", !watchSupplierId && "opacity-50 pointer-events-none")}>
              <div className="flex-auto space-y-2">
                <Label htmlFor="sku-input">SKU</Label>
                <Input id="sku-input" placeholder="Enter SKU..." value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="flex-auto space-y-2 min-w-[150px]">
                <Label htmlFor="itemName-input">Item Name</Label>
                <Input id="itemName-input" placeholder="Item name" value={itemName} readOnly />
              </div>
               <div className="flex-auto space-y-2 w-full sm:w-[150px] min-h-[70px]">
                  {foundProduct?.variant_track_enabled && (
                      <>
                          <Label>Variant</Label>
                          <Select onValueChange={setSelectedVariant} value={selectedVariant}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select"/>
                              </SelectTrigger>
                              <SelectContent>
                                  {foundProduct.available_variants.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </>
                  )}
                </div>
              <div className="flex-auto space-y-2 w-full sm:w-32">
                <Label htmlFor="buyPrice-input">Purchase Price</Label>
                <Input id="buyPrice-input" type="number" step="0.01" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
              </div>
              <div className="flex-auto space-y-2 w-full sm:w-20">
                <Label htmlFor="quantity-input">Qty</Label>
                <Input id="quantity-input" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="flex-shrink-0 self-end w-full sm:w-auto">
                <Button type="button" className="w-full" onClick={addToCart}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
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
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.variant_name || '-'}</TableCell>
                            <TableCell className="text-right">MMK {item.buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
            <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Purchase
            </Button>
        </div>
      </form>
    </Form>
  );
}
