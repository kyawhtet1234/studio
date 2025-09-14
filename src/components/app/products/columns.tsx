

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
import type { Product, Category, Supplier, Store } from "@/lib/types";

interface DeletableRow {
  id: string;
  name?: string;
}

const ActionsCell = <TData extends DeletableRow>({
  row,
  copyLabel,
  onDelete,
  deleteConfirmationText
}: {
  row: any,
  copyLabel: string,
  onDelete?: (id: string) => void
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
            {copyLabel}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Edit</DropdownMenuItem>
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

export const productColumns = ({ onDelete }: { onDelete: (id: string) => void }): ColumnDef<Product>[] => [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "sellPrice", header: "Sell Price", cell: ({ row }) => `MMK ${row.original.sellPrice.toFixed(2)}` },
  { accessorKey: "buyPrice", header: "Buy Price", cell: ({ row }) => `MMK ${row.original.buyPrice.toFixed(2)}` },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        copyLabel="Copy product ID"
        onDelete={onDelete}
        deleteConfirmationText={`This action cannot be undone. This will permanently delete the product "${row.original.name}" and all associated inventory records.`}
      />
    ),
  },
];

export const categoryColumns: ColumnDef<Category>[] = [
  { accessorKey: "name", header: "Name" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} copyLabel="Copy category ID" />
  },
];

export const supplierColumns: ColumnDef<Supplier>[] = [
  { accessorKey: "name", header: "Name" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} copyLabel="Copy supplier ID" />
  },
];

export const storeColumns: ColumnDef<Store>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location", header: "Location" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} copyLabel="Copy store ID" />
  },
];
