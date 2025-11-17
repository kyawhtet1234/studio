
"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Supplier, Store, Customer, PaymentType } from "@/lib/types";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  categoryId: z.string().min(1, "Please select a category."),
  supplierId: z.string().min(1, "Please select a supplier."),
  sellPrice: z.coerce.number().positive(),
  buyPrice: z.coerce.number().positive(),
  reorderPoint: z.coerce.number().min(0).optional(),
  variant_track_enabled: z.boolean().default(false),
  available_variants: z.array(z.string()).optional(),
}).refine(data => data.sellPrice >= data.buyPrice, {
    message: "Sell price cannot be less than buy price.",
    path: ["sellPrice"],
});

const storeSchema = baseSchema.extend({ location: z.string().min(5) });
const customerSchema = baseSchema.extend({ phone: z.string().min(5, "Phone must be at least 5 characters.") });

interface FormProps<T> {
  onSave: (data: T) => Promise<void>;
  onSuccess: () => void;
  entity?: any;
}

export function AddCategoryForm({ onSave, onSuccess, category, allCategories }: FormProps<Omit<Category, 'id'>> & { category?: Category, allCategories: Category[] }) {
  const form = useForm({ resolver: zodResolver(baseSchema), defaultValues: { name: category?.name || "" } });
  const { toast } = useToast();
  const isEditMode = !!category;

  useEffect(() => {
    if (category) form.reset({ name: category.name });
  }, [category, form]);

  async function onSubmit(data: z.infer<typeof baseSchema>) {
    const isDuplicate = allCategories.some(
      c => c.name.toLowerCase() === data.name.toLowerCase() && c.id !== category?.id
    );

    if (isDuplicate) {
      form.setError("name", {
        type: "manual",
        message: "This category name already exists.",
      });
      return;
    }

    await onSave(data);
    toast({ title: `Category ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
    form.reset();
    onSuccess();
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-shiny-blue">{isEditMode ? 'Save Changes' : 'Add Category'}</Button>
      </form>
    </Form>
  );
}

export function AddSupplierForm({ onSave, onSuccess, supplier }: FormProps<Omit<Supplier, 'id'>> & { supplier?: Supplier }) {
    const form = useForm({ resolver: zodResolver(baseSchema), defaultValues: { name: supplier?.name || "" } });
    const { toast } = useToast();
    const isEditMode = !!supplier;

    useEffect(() => {
        if (supplier) form.reset({ name: supplier.name });
    }, [supplier, form]);

    async function onSubmit(data: z.infer<typeof baseSchema>) {
        await onSave(data);
        toast({ title: `Supplier ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset();
        onSuccess();
    }
    return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="bg-shiny-blue">{isEditMode ? 'Save Changes' : 'Add Supplier'}</Button>
        </form>
        </Form>
    );
}

export function AddStoreForm({ onSave, onSuccess, store }: FormProps<Omit<Store, 'id'>> & { store?: Store }) {
    const form = useForm({ resolver: zodResolver(storeSchema), defaultValues: {name: store?.name || "", location: store?.location || ""} });
    const { toast } = useToast();
    const isEditMode = !!store;

    useEffect(() => {
        if (store) form.reset({ name: store.name, location: store.location });
    }, [store, form]);

    async function onSubmit(data: z.infer<typeof storeSchema>) { 
        await onSave(data);
        toast({ title: `Store ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset();
        onSuccess();
    }

    return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" className="bg-shiny-blue">{isEditMode ? 'Save Changes' : 'Add Store'}</Button>
      </form>
    </Form>
    );
}

export function AddCustomerForm({ onSave, onSuccess, customer }: FormProps<Omit<Customer, 'id'>> & { customer?: Customer }) {
    const form = useForm({ resolver: zodResolver(customerSchema), defaultValues: { name: customer?.name || "", phone: customer?.phone || "" } });
    const { toast } = useToast();
    const isEditMode = !!customer;

    useEffect(() => {
        if (customer) form.reset({ name: customer.name, phone: customer.phone });
    }, [customer, form]);

    async function onSubmit(data: z.infer<typeof customerSchema>) {
        await onSave(data);
        toast({ title: `Customer ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset();
        onSuccess();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="bg-shiny-blue">{isEditMode ? 'Save Changes' : 'Add Customer'}</Button>
            </form>
        </Form>
    );
}

export function AddPaymentTypeForm({ onSave, onSuccess, paymentType }: FormProps<Omit<PaymentType, 'id'>> & { paymentType?: PaymentType }) {
  const form = useForm({ resolver: zodResolver(baseSchema), defaultValues: { name: paymentType?.name || "" } });
  const { toast } = useToast();
  const isEditMode = !!paymentType;

  useEffect(() => {
    if (paymentType) form.reset({ name: paymentType.name });
  }, [paymentType, form]);

  async function onSubmit(data: z.infer<typeof baseSchema>) {
    await onSave(data);
    toast({ title: `Payment Type ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
    form.reset();
    onSuccess();
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Credit Card" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-shiny-blue">{isEditMode ? 'Save Changes' : 'Add Payment Type'}</Button>
      </form>
    </Form>
  );
}


interface AddProductFormProps extends FormProps<Omit<Product, 'id' | 'createdAt'>> {
  categories: Category[];
  suppliers: Supplier[];
  allProducts: Product[];
  product?: Product;
}

export function AddProductForm({ onSave, categories, suppliers, allProducts, onSuccess, product }: AddProductFormProps) {
    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: product ? {
            ...product,
            sellPrice: product.sellPrice ?? 0,
            buyPrice: product.buyPrice ?? 0,
            reorderPoint: product.reorderPoint ?? 0,
            variant_track_enabled: product.variant_track_enabled ?? false,
            available_variants: product.available_variants ?? [],
        } : { 
            name: "", sku: "", categoryId: "", supplierId: "", 
            sellPrice: 0, buyPrice: 0, reorderPoint: 0,
            variant_track_enabled: false, available_variants: [] 
        },
    });
    const { toast } = useToast();
    const isEditMode = !!product;
    const [newVariant, setNewVariant] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "available_variants",
    });

    const watchVariantTrackEnabled = form.watch('variant_track_enabled');

    useEffect(() => {
        if (product) {
            form.reset({
                ...product,
                reorderPoint: product.reorderPoint ?? 0,
                variant_track_enabled: product.variant_track_enabled ?? false,
                available_variants: product.available_variants ?? [],
            });
        }
    }, [product, form]);

    const handleAddVariant = () => {
        if (newVariant.trim() !== '') {
            append(newVariant.trim());
            setNewVariant('');
        }
    };

    async function onSubmit(data: z.infer<typeof productSchema>) {
        if (isLoading) return; // Prevent submission if already loading
        setIsLoading(true);

        if (!isEditMode) {
            const skuExists = allProducts.some(p => p.sku === data.sku);
            if (skuExists) {
                form.setError("sku", {
                    type: "manual",
                    message: "This SKU already exists. Please use a unique SKU.",
                });
                setIsLoading(false);
                return;
            }
        }

        try {
            await onSave(data);
            toast({ title: `Product ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
            form.reset();
            onSuccess();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not save the product."})
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="sku" render={({ field }) => (
                                <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="categoryId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="supplierId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Supplier</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger></FormControl>
                                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <FormField control={form.control} name="buyPrice" render={({ field }) => (
                                <FormItem><FormLabel>Buy Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="sellPrice" render={({ field }) => (
                                <FormItem><FormLabel>Sell Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="reorderPoint" render={({ field }) => (
                            <FormItem><FormLabel>Reorder Point</FormLabel><FormControl><Input type="number" step="1" {...field} placeholder="e.g. 3" /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField
                            control={form.control}
                            name="variant_track_enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Variants</FormLabel>
                                    <FormMessage />
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         {watchVariantTrackEnabled && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Available Variants</h3>
                                <div className="flex gap-2">
                                    <Input
                                        value={newVariant}
                                        onChange={(e) => setNewVariant(e.target.value)}
                                        placeholder="e.g., Red, Small, etc."
                                    />
                                    <Button type="button" onClick={handleAddVariant}>Add Variant</Button>
                                </div>
                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center justify-between">
                                            <span>{form.getValues(`available_variants.${index}`)}</span>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="pt-6 mt-auto">
                    <Button type="submit" className="bg-shiny-blue w-full" disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {isEditMode ? 'Save Changes' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

