"use client";

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

import type { Product, Category, Supplier, Store } from "@/lib/types";

const createActionsCell = <TData extends { id: string }>(
  copyLabel: string
): ColumnDef<TData>['cell'] => ({ row }) => {
  const item = row.original;

  return (
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
        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export const productColumns: ColumnDef<Product>[] = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "sellPrice", header: "Sell Price", cell: ({ row }) => `$${row.original.sellPrice.toFixed(2)}` },
  { accessorKey: "buyPrice", header: "Buy Price", cell: ({ row }) => `$${row.original.buyPrice.toFixed(2)}` },
  { id: "actions", cell: createActionsCell<Product>("Copy product ID") },
];

export const categoryColumns: ColumnDef<Category>[] = [
  { accessorKey: "name", header: "Name" },
  { id: "actions", cell: createActionsCell<Category>("Copy category ID") },
];

export const supplierColumns: ColumnDef<Supplier>[] = [
  { accessorKey: "name", header: "Name" },
  { id: "actions", cell: createActionsCell<Supplier>("Copy supplier ID") },
];

export const storeColumns: ColumnDef<Store>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location", header: "Location" },
  { id: "actions", cell: createActionsCell<Store>("Copy store ID") },
];
