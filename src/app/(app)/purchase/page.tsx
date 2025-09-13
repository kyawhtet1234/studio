
'use client';

import { PageHeader } from "@/components/app/page-header";
import { PurchaseForm } from "@/components/app/purchase/purchase-form";
import { useData } from "@/lib/data-context";

export default function PurchasePage() {
  const { suppliers } = useData();
  return (
    <div>
      <PageHeader title="New Purchase" />
      <PurchaseForm suppliers={suppliers} />
    </div>
  );
}
