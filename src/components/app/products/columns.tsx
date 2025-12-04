
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
import type { Product, Category, Supplier, Store, Customer, PaymentType, ExpenseCategory } from "@/lib/types";

interface DeletableRow {
  id: string;
  name?: string;
}

const ActionsCell = <TData extends DeletableRow>({
  row,
  copyLabel,
  onEdit,
  onDelete,
  deleteConfirmationText
}: {
  row: any,
  copyLabel: string,
  onEdit?: (item: TData) => void,
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
              {deleteConfirmationText || `This action cannot be undone. This will permanently delete the item '${item.name}'.`}
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

export const productColumns = ({ onEdit, onDelete }: { onEdit: (item: Product) => void, onDelete: (id: string) => void }): ColumnDef<Product>[] => [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Name" },
  { 
    accessorKey: "available_variants", 
    header: "Variants",
    cell: ({ row }) => {
      const variants = row.original.available_variants;
      if (!variants || variants.length === 0) return "-";
      return variants.join(", ");
    }
  },
  { accessorKey: "sellPrice", header: "Sell Price", cell: ({ row }) => `MMK ${row.original.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  { accessorKey: "buyPrice", header: "Buy Price", cell: ({ row }) => `MMK ${row.original.buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
  { 
    accessorKey: "reorderLevel", 
    header: "Reorder Level",
    cell: ({ row }) => {
        const { avgDailyDemand = 0, maxDailyDemand = 0, avgLeadTime = 0, maxLeadTime = 0 } = row.original;
        const safetyStock = (maxDailyDemand * maxLeadTime) - (avgDailyDemand * avgLeadTime);
        const reorderLevel = (avgDailyDemand * avgLeadTime) + safetyStock;
        return reorderLevel > 0 ? Math.round(reorderLevel) : "-";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        copyLabel="Copy product ID"
        onEdit={onEdit}
        onDelete={onDelete}
        deleteConfirmationText={`This action cannot be undone. This will permanently delete the product "${row.original.name}" and all associated inventory records.`}
      />
    ),
  },
];

export const categoryColumns = ({ onEdit, onDelete }: { onEdit: (item: Category) => void, onDelete: (id: string) => void }): ColumnDef<Category>[] => [
  { accessorKey: "name", header: "Name" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row} 
      copyLabel="Copy category ID" 
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the category "${row.original.name}". Products in this category will not be deleted.`}
    />
  },
];

export const supplierColumns = ({ onEdit, onDelete }: { onEdit: (item: Supplier) => void, onDelete: (id: string) => void }): ColumnDef<Supplier>[] => [
  { accessorKey: "name", header: "Name" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row} 
      copyLabel="Copy supplier ID" 
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the supplier "${row.original.name}". Products from this supplier will not be deleted.`}
    />
  },
];

export const storeColumns = ({ onEdit, onDelete }: { onEdit: (item: Store) => void, onDelete: (id: string) => void }): ColumnDef<Store>[] => [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location", header: "Location" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row} 
      copyLabel="Copy store ID" 
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the store "${row.original.name}" and all associated inventory.`}
    />
  },
];

export const customerColumns = ({ onEdit, onDelete }: { onEdit: (item: Customer) => void, onDelete: (id: string) => void }): ColumnDef<Customer>[] => [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    {
        id: "actions",
        cell: ({ row }) => (
            <ActionsCell
                row={row}
                copyLabel="Copy customer ID"
                onEdit={onEdit}
                onDelete={onDelete}
                deleteConfirmationText={`This action cannot be undone. This will permanently delete the customer "${row.original.name}".`}
            />
        ),
    },
];

export const paymentTypeColumns = ({ onEdit, onDelete }: { onEdit: (item: PaymentType) => void, onDelete: (id: string) => void }): ColumnDef<PaymentType>[] => [
  { accessorKey: "name", header: "Name" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row} 
      copyLabel="Copy payment type ID" 
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the payment type "${row.original.name}".`}
    />
  },
];

export const expenseCategoryColumns = ({ onEdit, onDelete }: { onEdit: (item: ExpenseCategory) => void, onDelete: (id: string) => void }): ColumnDef<ExpenseCategory>[] => [
  { accessorKey: "name", header: "Name" },
  { 
    id: "actions",
    cell: ({ row }) => <ActionsCell 
      row={row}
      copyLabel="Copy category ID"
      onEdit={onEdit}
      onDelete={onDelete}
      deleteConfirmationText={`This will permanently delete the category "${row.original.name}".`}
    />
  },
];
