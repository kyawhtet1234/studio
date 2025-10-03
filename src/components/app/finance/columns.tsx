
"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
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
import type { Expense, ExpenseCategory, CashAllocation, Liability } from "@/lib/types";
import { format } from 'date-fns';
import { Progress } from "@/components/ui/progress";

interface DeletableRow {
  id: string;
  name?: string;
  description?: string;
}

const ActionsCell = <TData extends DeletableRow>({
  row,
  onEdit,
  onDelete,
  deleteConfirmationText
}: {
  row: any,
  onEdit?: (item: TData) => void,
  onDelete?: (id: string) => void,
  deleteConfirmationText?: string
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const item = row.original as TData;
  const { toast } = useToast();

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
      toast({
        title: "Success",
        description: `${item.name || 'Item'} has been deleted.`,
      });
    }
    setIsDeleteDialogOpen(false);
  };

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
           {onEdit && <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>}
          {onDelete && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmationText || `This action cannot be undone. This will permanently delete the item.`}
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

export const expenseColumns = ({ onDelete, categories }: { onDelete: (id: string) => void, categories: ExpenseCategory[] }): ColumnDef<Expense>[] => [
  { 
    accessorKey: "date", 
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.date as Date), "PPP")
  },
  { 
    accessorKey: "categoryId", 
    header: "Category",
    cell: ({ row }) => categories.find(c => c.id === row.original.categoryId)?.name || row.original.categoryId
  },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => `MMK ${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onDelete={onDelete}
        deleteConfirmationText="This will permanently delete the expense record."
      />
    ),
  },
];


export const cashAllocationColumns = ({ onEdit, onDelete }: { onEdit: (item: CashAllocation) => void, onDelete: (id: string) => void }): ColumnDef<CashAllocation>[] => [
  { accessorKey: "name", header: "Name" },
  { 
    accessorKey: "currentAmount", 
    header: "Current Amount",
    cell: ({ row }) => `MMK ${row.original.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  { 
    accessorKey: "targetAmount", 
    header: "Target Amount",
    cell: ({ row }) => `MMK ${row.original.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const allocation = row.original;
      const progress = (allocation.currentAmount / allocation.targetAmount) * 100;
      return (
        <div className="flex items-center gap-2">
          <Progress value={progress} className="w-full" />
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )
    }
  },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row}
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the allocation "${row.original.name}".`}
    />
  },
];

export const liabilityColumns = ({ onEdit, onDelete }: { onEdit: (item: Liability) => void, onDelete: (id: string) => void }): ColumnDef<Liability>[] => [
  { accessorKey: "name", header: "Name" },
  { 
    accessorKey: "amount", 
    header: "Amount",
    cell: ({ row }) => `MMK ${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row}
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the liability "${row.original.name}".`}
    />
  },
];
