
'use client';

import { PageHeader } from "@/components/app/page-header";
import { PurchaseForm } from "@/components/app/purchase/purchase-form";
import { useData } from "@/lib/data-context";
import type { PurchaseTransaction } from "@/lib/types";

export default function PurchasePage() {
  const { stores, addPurchase } = useData();

  const handleSavePurchase = (newPurchase: Omit<PurchaseTransaction, 'id' | 'date'>) => {
    addPurchase({
      ...newPurchase,
      id: `pur-${Date.now()}`,
      date: new Date(),
    });
  };
  
  return (
    <div>
      <PageHeader title="New Purchase" />
      <PurchaseForm stores={stores} onSavePurchase={handleSavePurchase}/>
    </div>
  );
}

