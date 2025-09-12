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
import { categories, suppliers } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  categoryId: z.string(),
  supplierId: z.string(),
  sellPrice: z.coerce.number().positive(),
  buyPrice: z.coerce.number().positive(),
});

function GenericForm({ schema, defaultValues, buttonText, entityName }: { schema: any, defaultValues: any, buttonText: string, entityName: string }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues });
  const { toast } = useToast();
  function onSubmit(data: any) { 
    console.log(data);
    toast({ title: `${entityName} Added`, description: `${data.name} has been successfully added.` });
    form.reset();
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
        <Button type="submit">{buttonText}</Button>
      </form>
    </Form>
  );
}

export const AddCategoryForm = () => <GenericForm schema={baseSchema} defaultValues={{ name: "" }} buttonText="Add Category" entityName="Category" />;
export const AddSupplierForm = () => <GenericForm schema={baseSchema} defaultValues={{ name: "" }} buttonText="Add Supplier" entityName="Supplier" />;
export function AddStoreForm() {
    const storeSchema = baseSchema.extend({ location: z.string().min(5) });
    const form = useForm({ resolver: zodResolver(storeSchema), defaultValues: {name: "", location: ""} });
    const { toast } = useToast();
    function onSubmit(data: any) { 
        console.log(data); 
        toast({ title: "Store Added", description: `${data.name} has been successfully added.` });
        form.reset();
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
        <Button type="submit">Add Store</Button>
      </form>
    </Form>
    );
}

export function AddProductForm() {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", sku: "", categoryId: "", supplierId: "", sellPrice: 0, buyPrice: 0 },
  });
  const { toast } = useToast();

  function onSubmit(data: z.infer<typeof productSchema>) { 
      console.log(data);
      toast({ title: "Product Added", description: `${data.name} has been successfully added.` });
      form.reset();
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="supplierId" render={({ field }) => (
          <FormItem>
            <FormLabel>Supplier</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <Button type="submit">Add Product</Button>
      </form>
    </Form>
  );
}
