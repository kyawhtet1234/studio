
'use client';

import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import type { SaleTransaction } from '@/lib/types';
import { useData } from "@/lib/data-context";

export default function SalesPage() {
  const { addSale, stores } = useData();

  const handleSaveSale = (newSale: Omit<SaleTransaction, 'id' | 'date' | 'status'>) => {
    addSale(newSale);
  };

  return (
    <div>
      <PageHeader title="New Sale" />
      <SalesForm stores={stores} onSave={handleSaveSale} />
    </div>
  );
}
