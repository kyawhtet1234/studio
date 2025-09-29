
'use client';

import { PageHeader } from "@/components/app/page-header";
import { PurchaseForm } from "@/components/app/purchase/purchase-form";
import { useData } from "@/lib/data-context";
import type { PurchaseTransaction } from "@/lib/types";

export default function PurchasePage() {
  const { stores, suppliers, addPurchase } = useData();

  const handleSavePurchase = async (newPurchase: Omit<PurchaseTransaction, 'id'>) => {
    await addPurchase(newPurchase);
  };
  
  return (
    <div>
      <PageHeader title="New Purchase" />
      <div className="overflow-x-auto">
        <PurchaseForm stores={stores} suppliers={suppliers} onSavePurchase={handleSavePurchase}/>
      </div>
    </div>
  );
}

    
