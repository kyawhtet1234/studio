
'use client';

import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import type { SaleTransaction } from '@/lib/types';
import { useData } from "@/lib/data-context";

export default function SalesPage() {
  const { addSale } = useData();

  const handleSaveSale = (newSale: Omit<SaleTransaction, 'id' | 'date' | 'storeId'>) => {
    const sale: SaleTransaction = {
      ...newSale,
      id: `sale-${Date.now()}`,
      date: new Date(),
      storeId: 'store-1', // Mock storeId
    };
    addSale(sale);
  };

  return (
    <div>
      <PageHeader title="New Sale" />
      <SalesForm onSave={handleSaveSale} />
    </div>
  );
}
