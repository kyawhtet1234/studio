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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Employee, SalaryAdvance, LeaveRecord } from "@/lib/types";
import { useEffect } from "react";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  baseSalary: z.coerce.number().positive("Base salary must be a positive number."),
});

const advanceSchema = z.object({
    employeeId: z.string(),
    date: z.date(),
    amount: z.coerce.number().positive("Amount must be positive."),
    notes: z.string().optional(),
});

const leaveSchema = z.object({
    employeeId: z.string(),
    date: z.date(),
});


interface FormProps<T> {
  onSave: (data: T) => Promise<void>;
  onSuccess: () => void;
}

export function AddEmployeeForm({ onSave, onSuccess, employee }: FormProps<Omit<Employee, 'id'>> & { employee?: Employee }) {
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name || "",
      baseSalary: employee?.baseSalary || 0,
    }
  });
  const { toast } = useToast();
  const isEditMode = !!employee;

  useEffect(() => {
    if (employee) form.reset(employee);
  }, [employee, form]);

  async function onSubmit(data: z.infer<typeof employeeSchema>) {
    await onSave(data);
    toast({ title: `Employee ${isEditMode ? 'Updated' : 'Added'}`, description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'added'}.` });
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
              <FormLabel>Employee Name</FormLabel>
              <FormControl><Input {...field} placeholder="e.g. John Doe" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Salary (MMK)</FormLabel>
              <FormControl><Input type="number" step="1000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="bg-shiny-blue">{isEditMode ? 'Save Changes' : 'Add Employee'}</Button>
      </form>
    </Form>
  );
}

export function RecordAdvanceForm({ employee, onSave, onSuccess }: FormProps<Omit<SalaryAdvance, 'id'>> & { employee: Employee }) {
    const form = useForm({
        resolver: zodResolver(advanceSchema),
        defaultValues: {
            employeeId: employee.id,
            date: new Date(),
            amount: 0,
            notes: ""
        }
    });
    const { toast } = useToast();

    async function onSubmit(data: z.infer<typeof advanceSchema>) {
        await onSave(data);
        toast({ title: "Advance Recorded", description: `Advance of MMK ${data.amount} for ${employee.name} recorded.` });
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
                        <FormLabel>Date of Advance</FormLabel>
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount (MMK)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. For personal emergency" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="bg-shiny-blue">Record Advance</Button>
            </form>
        </Form>
    );
}


export function RecordLeaveForm({ employee, onSave, onSuccess }: FormProps<Omit<LeaveRecord, 'id'>> & { employee: Employee }) {
    const form = useForm({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            employeeId: employee.id,
            date: new Date(),
        }
    });
    const { toast } = useToast();

    async function onSubmit(data: z.infer<typeof leaveSchema>) {
        await onSave(data);
        toast({ title: "Leave Recorded", description: `Leave on ${format(data.date, 'PP')} for ${employee.name} recorded.` });
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
                        <FormLabel>Leave Date</FormLabel>
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="bg-shiny-blue">Record Leave</Button>
            </form>
        </Form>
    );
}
