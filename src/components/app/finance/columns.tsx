
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
  DropdownMenuSeparator,
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
import type { Expense } from "@/lib/types";
import { format } from 'date-fns';

interface DeletableRow {
  id: string;
  description?: string;
}

const ActionsCell = <TData extends DeletableRow>({
  row,
  onDelete,
}: {
  row: any,
  onDelete?: (id: string) => void
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const item = row.original as TData;
  const { toast } = useToast();

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
      toast({
        title: "Success",
        description: `Expense has been deleted.`,
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
              This action cannot be undone. This will permanently delete the expense record.
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

export const expenseColumns = ({ onDelete }: { onDelete: (id: string) => void }): ColumnDef<Expense>[] => [
  { 
    accessorKey: "date", 
    header: "Date",
    cell: ({ row }) => format(row.original.date as Date, 'PPP')
  },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => `MMK ${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onDelete={onDelete}
      />
    ),
  },
];
