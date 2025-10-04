
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Printer, Edit, Trash2, CheckCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { SaleTransaction, Customer } from "@/lib/types";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActionsCellProps {
  row: any,
  onEdit: (item: SaleTransaction) => void,
  onDelete: (id: string) => void,
  onPrint: (item: SaleTransaction) => void,
  onMarkAsPaid: (id: string) => void,
  onRecordPayment: (item: SaleTransaction) => void,
  type: 'invoice' | 'quotation'
}

const ActionsCell = ({ row, onEdit, onDelete, onPrint, onMarkAsPaid, onRecordPayment, type }: ActionsCellProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const item = row.original as SaleTransaction;
  const { toast } = useToast();

  const handleDelete = () => {
    onDelete(item.id);
    toast({
      title: "Success",
      description: `${type === 'invoice' ? 'Invoice' : 'Quotation'} has been deleted.`,
    });
    setIsDeleteDialogOpen(false);
  };
  
  const handleMarkAsPaid = () => {
    onMarkAsPaid(item.id);
    toast({
      title: "Success",
      description: "Invoice marked as paid and converted to sale.",
    });
  };

  const isPaid = item.status === 'completed' || item.status === 'paid';
  const isQuotation = type === 'quotation';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {!isQuotation && (
            <>
              <DropdownMenuItem onClick={() => onRecordPayment(item)} disabled={isPaid}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkAsPaid} disabled={isPaid || item.balance > 0}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => onPrint(item)}>
            <Printer className="mr-2 h-4 w-4" />
            View / Print
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => onEdit(item)} disabled={isPaid}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const getStatusVariant = (status: SaleTransaction['status'], balance: number) => {
    if (status === 'voided') return 'destructive';
    if (status === 'completed' || status === 'paid' || balance === 0) return 'default';
    if (status === 'partially-paid' || balance > 0) return 'secondary';
    if (status === 'invoice' || status === 'quotation') return 'outline';
    return 'default';
}

const getStatusText = (status: SaleTransaction['status'], balance: number, type: 'invoice' | 'quotation') => {
    if (status === 'voided') return 'Voided';
    if (type === 'quotation') return 'Quotation';
    if (status === 'completed' || status === 'paid' || (status==='invoice' && balance === 0)) return 'Paid';
    if (balance > 0 && status !== 'invoice' && status !== 'partially-paid') return 'Partially Paid';
    if (status === 'partially-paid') return 'Partially Paid';
    return 'Unpaid';
}


export const documentColumns = ({ customers, onEdit, onDelete, onPrint, onMarkAsPaid, onRecordPayment, type }: { customers: Customer[], onEdit: (item: SaleTransaction) => void, onDelete: (id: string) => void, onPrint: (item: SaleTransaction) => void, onMarkAsPaid: (id: string) => void, onRecordPayment: (item: SaleTransaction) => void, type: 'invoice' | 'quotation' }): ColumnDef<SaleTransaction>[] => [
  { 
    accessorKey: "date", 
    header: "Date",
    cell: ({ row }) => format(row.original.date as Date, 'PPP')
  },
   { 
    accessorKey: "id", 
    header: "Number",
    cell: ({ row }) => `#${row.original.id.slice(-6).toUpperCase()}`
  },
  { 
    accessorKey: "customerId", 
    header: "Customer",
    cell: ({ row }) => customers.find(c => c.id === row.original.customerId)?.name || 'Walk-in'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({row}) => {
        const { status, balance } = row.original;
        const variant = getStatusVariant(status, balance);
        const text = getStatusText(status, balance, type);
        return <Badge variant={variant} className={cn("capitalize")}>{text}</Badge>
    }
  },
  { 
    accessorKey: "total", 
    header: "Total Amount", 
    cell: ({ row }) => `MMK ${row.original.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
  },
    { 
    accessorKey: "paidAmount", 
    header: "Paid Amount", 
    cell: ({ row }) => `MMK ${(row.original.paidAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
  },
    { 
    accessorKey: "balance", 
    header: "Balance Due", 
    cell: ({ row }) => `MMK ${(row.original.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onPrint={onPrint}
        onMarkAsPaid={onMarkAsPaid}
        onRecordPayment={onRecordPayment}
        type={type}
      />
    ),
  },
];
