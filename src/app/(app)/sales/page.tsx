
'use client';

import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import { DocumentForm } from "@/components/app/sales/document-form";
import type { SaleTransaction } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SalesPage() {
  const { addSale, stores, customers, addCustomer } = useData();

  const handleSaveSale = async (newSale: Omit<SaleTransaction, 'id' | 'date' | 'status'>) => {
    await addSale(newSale);
  };

  return (
    <div>
      <PageHeader title="Sales & Documents" />
      <Tabs defaultValue="sale">
        <TabsList>
            <TabsTrigger value="sale">New Sale</TabsTrigger>
            <TabsTrigger value="invoice">New Invoice</TabsTrigger>
            <TabsTrigger value="quotation">New Quotation</TabsTrigger>
        </TabsList>
        <TabsContent value="sale">
            <div className="mt-4">
                <SalesForm stores={stores} customers={customers} onSave={handleSaveSale} onAddCustomer={addCustomer} />
            </div>
        </TabsContent>
        <TabsContent value="invoice">
            <div className="mt-4">
                <DocumentForm type="invoice" stores={stores} customers={customers} onSave={handleSaveSale} onAddCustomer={addCustomer} />
            </div>
        </TabsContent>
        <TabsContent value="quotation">
            <div className="mt-4">
                <DocumentForm type="quotation" stores={stores} customers={customers} onSave={handleSaveSale} onAddCustomer={addCustomer} />
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
