import { PageHeader } from "@/components/app/page-header";
import { PurchaseForm } from "@/components/app/purchase/purchase-form";
import { suppliers } from "@/lib/data";

export default function PurchasePage() {
  return (
    <div>
      <PageHeader title="New Purchase" />
      <PurchaseForm suppliers={suppliers} />
    </div>
  );
}
