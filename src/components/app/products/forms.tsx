
"use client";
import { useForm } from "react-hook-form";
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
import { useEffect } from "react";

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
});

const storeSchema = baseSchema.extend({ location: z.string().min(5) });
const customerSchema = baseSchema.extend({ phone: z.string().min(5, "Phone must be at least 5 characters.") });

interface FormProps<T> {
  onSave: (data: T) => Promise<void>;
  onSuccess: () => void;
  entity?: any;
}

export function AddCategoryForm({ onSave, onSuccess, category }: FormProps<Omit<Category, 'id'>> & { category?: Category }) {
  const form = useForm({ resolver: zodResolver(baseSchema), defaultValues: { name: category?.name || "" } });
  const { toast } = useToast();
  const isEditMode = !!category;

  useEffect(() => {
    if (category) form.reset({ name: category.name });
  }, [category, form]);

  async function onSubmit(data: z.infer<typeof baseSchema>) {
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
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Category'}</Button>
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
            <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Supplier'}</Button>
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
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Store'}</Button>
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
                <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Customer'}</Button>
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
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Payment Type'}</Button>
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
    } : { name: "", sku: "", categoryId: "", supplierId: "", sellPrice: 0, buyPrice: 0 },
  });
  const { toast } = useToast();
  const isEditMode = !!product;

  useEffect(() => {
      if (product) {
          form.reset(product);
      }
  }, [product, form]);

  async function onSubmit(data: z.infer<typeof productSchema>) {
      if (!isEditMode) {
        const skuExists = allProducts.some(p => p.sku === data.sku);
        if (skuExists) {
            form.setError("sku", {
                type: "manual",
                message: "This SKU already exists. Please use a unique SKU.",
            });
            return;
        }
    }
      await onSave(data);
      toast({ title: `Product ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
      form.reset();
      onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <FormField control={form.control} name="sellPrice" render={({ field }) => (
            <FormItem><FormLabel>Sell Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="buyPrice" render={({ field }) => (
            <FormItem><FormLabel>Buy Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Product'}</Button>
      </form>
    </Form>
  );
}
