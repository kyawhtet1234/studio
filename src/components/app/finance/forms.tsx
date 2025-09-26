
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
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";

const expenseSchema = z.object({
  date: z.date(),
  category: z.string().min(1, "Please select a category."),
  description: z.string().min(2, "Description must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

const expenseCategories = ["Rent", "Utilities", "Salaries", "Supplies", "Marketing", "Miscellaneous"];

interface FormProps<T> {
  onSave: (data: T) => Promise<void>;
  onSuccess: () => void;
  entity?: any;
}

export function AddExpenseForm({ onSave, onSuccess }: FormProps<Omit<Expense, 'id'>>) {
  const form = useForm({ 
    resolver: zodResolver(expenseSchema), 
    defaultValues: { 
        date: new Date(), 
        category: "",
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
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
              <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
