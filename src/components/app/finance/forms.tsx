
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseCategory, CashAllocation, Liability } from "@/lib/types";
import { useEffect } from "react";


const expenseSchema = z.object({
  date: z.date(),
  categoryId: z.string().min(1, "Please select a category."),
  description: z.string().min(2, "Description must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

const expenseCategorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
});

const cashAllocationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    targetAmount: z.coerce.number().positive("Target amount must be a positive number."),
    currentAmount: z.coerce.number().min(0).optional().default(0),
});

const liabilitySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
});

interface FormProps<T> {
  onSave: (data: T) => Promise<void>;
  onSuccess: () => void;
  entity?: any;
}

export function AddExpenseForm({ onSave, onSuccess, categories }: FormProps<Omit<Expense, 'id'>> & { categories: ExpenseCategory[] }) {
  const form = useForm({ 
    resolver: zodResolver(expenseSchema), 
    defaultValues: { 
        date: new Date(), 
        categoryId: "",
        description: "",
        amount: 0,
    } 
  });
  const { toast } = useToast();

  async function onSubmit(data: z.infer<typeof expenseSchema>) {
    await onSave(data);
    toast({ title: `Expense Added`, description: `Expense of ${data.amount} has been successfully added.` });
    form.reset();
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
                <FormControl>
                    <Input
                        type="date"
                        value={field.value ? formatISO(field.value, { representation: 'date' }) : ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                field.onChange(new Date(e.target.value));
                            }
                        }}
                    />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit">Add Expense</Button>
      </form>
    </Form>
  );
}

export function AddExpenseCategoryForm({ onSave, onSuccess, category }: FormProps<Omit<ExpenseCategory, 'id'>> & { category?: ExpenseCategory }) {
  const form = useForm({ resolver: zodResolver(expenseCategorySchema), defaultValues: { name: category?.name || "" } });
  const { toast } = useToast();
  const isEditMode = !!category;

  useEffect(() => {
    if (category) form.reset({ name: category.name });
  }, [category, form]);

  async function onSubmit(data: z.infer<typeof expenseCategorySchema>) {
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

export function AddCashAllocationForm({ onSave, onSuccess, allocation }: FormProps<Omit<CashAllocation, 'id'>> & { allocation?: CashAllocation }) {
  const form = useForm({
    resolver: zodResolver(cashAllocationSchema),
    defaultValues: {
      name: allocation?.name || "",
      targetAmount: allocation?.targetAmount || 0,
      currentAmount: allocation?.currentAmount || 0,
    }
  });
  const { toast } = useToast();
  const isEditMode = !!allocation;

  useEffect(() => {
    if (allocation) form.reset(allocation);
  }, [allocation, form]);

  async function onSubmit(data: z.infer<typeof cashAllocationSchema>) {
    await onSave(data);
    toast({ title: `Allocation ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
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
              <FormLabel>Allocation Name</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. New Equipment Fund" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount</FormLabel>
              <FormControl><Input type="number" step="1000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isEditMode && (
          <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Current Amount</FormLabel>
                    <FormControl><Input type="number" step="1000" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        )}
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Allocation'}</Button>
      </form>
    </Form>
  );
}

export function AddLiabilityForm({ onSave, onSuccess, liability }: FormProps<Omit<Liability, 'id'>> & { liability?: Liability }) {
  const form = useForm({
    resolver: zodResolver(liabilitySchema),
    defaultValues: {
      name: liability?.name || "",
      amount: liability?.amount || 0,
    }
  });
  const { toast } = useToast();
  const isEditMode = !!liability;

  useEffect(() => {
    if (liability) form.reset(liability);
  }, [liability, form]);

  async function onSubmit(data: z.infer<typeof liabilitySchema>) {
    await onSave(data);
    toast({ title: `Liability ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
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
              <FormLabel>Liability Name</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. Bank Loan" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl><Input type="number" step="1000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Liability'}</Button>
      </form>
    </Form>
  );
}
