import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";

export default function SalesPage() {
  return (
    <div>
      <PageHeader title="New Sale" />
      <SalesForm />
    </div>
  );
}
