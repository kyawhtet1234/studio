
'use client';

import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import { DocumentForm } from "@/components/app/sales/document-form";
import type { SaleTransaction } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SalesPage() {
  const { addSale, stores, customers, addCustomer } = useData();

  const handleSaveDocument = async (docData: Omit<SaleTransaction, 'id'>) => {
    await addSale(docData);
  };

  return (
    <div>
      <PageHeader title="Sales & Documents" />
      <Tabs defaultValue="sale">
        <TabsList className="overflow-x-auto self-start h-auto flex-nowrap w-full no-scrollbar">
            <TabsTrigger value="sale">New Sale</TabsTrigger>
            <TabsTrigger value="invoice">New Invoice</TabsTrigger>
            <TabsTrigger value="quotation">New Quotation</TabsTrigger>
        </TabsList>
        <TabsContent value="sale">
            <div className="mt-4">
                <SalesForm stores={stores} customers={customers} onSave={(saleData) => addSale({...saleData, status: 'completed' })} onAddCustomer={addCustomer} />
            </div>
        </TabsContent>
        <TabsContent value="invoice">
            <div className="mt-4">
                <DocumentForm type="invoice" stores={stores} customers={customers} onSave={handleSaveDocument} onAddCustomer={addCustomer} onSuccess={() => {}} />
            </div>
        </TabsContent>
        <TabsContent value="quotation">
            <div className="mt-4">
                <DocumentForm type="quotation" stores={stores} customers={customers} onSave={handleSaveDocument} onAddCustomer={addCustomer} onSuccess={() => {}}/>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
