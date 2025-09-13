
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import { sales as initialSales } from '@/lib/data';
import type { SaleTransaction } from '@/lib/types';

export default function SalesPage() {
  const [sales, setSales] = useState<SaleTransaction[]>(initialSales);

  const handleSaveSale = (newSale: Omit<SaleTransaction, 'id' | 'date' | 'storeId'>) => {
    const sale: SaleTransaction = {
      ...newSale,
      id: `sale-${Date.now()}`,
      date: new Date(),
      storeId: 'store-1', // Mock storeId
    };
    setSales(prev => [sale, ...prev]);
  };

  return (
    <div>
      <PageHeader title="New Sale" />
      <SalesForm onSave={handleSaveSale} />
    </div>
  );
}
