
'use client';

import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import { DocumentForm } from "@/components/app/sales/document-form";
import type { SaleTransaction } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt } from "@/components/app/sales/receipt";


export default function SalesPage() {
  const { addSale, stores, customers, addCustomer, sales: allSales } = useData();
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  const handleSaveDocument = async (docData: Omit<SaleTransaction, 'id'>) => {
    return await addSale(docData);
  };
  
  const lastSale = allSales.find(s => s.id === lastSaleId);

  const handlePrintLastReceipt = () => {
    if (lastSaleId) {
      setIsReceiptDialogOpen(true);
    }
  };

  return (
    <div>
      <PageHeader title="Sales & Documents">
        <Button
            onClick={handlePrintLastReceipt}
            disabled={!lastSaleId}
            variant="outline"
        >
            <Printer className="mr-2 h-4 w-4" />
            Print Last Receipt
        </Button>
      </PageHeader>
      <Tabs defaultValue="sale">
        <TabsList className="overflow-x-auto self-start h-auto flex-nowrap w-full no-scrollbar">
            <TabsTrigger value="sale">New Sale</TabsTrigger>
            <TabsTrigger value="invoice">New Invoice</TabsTrigger>
            <TabsTrigger value="quotation">New Quotation</TabsTrigger>
        </TabsList>
        <TabsContent value="sale">
            <div className="mt-4">
                <SalesForm 
                    stores={stores} 
                    customers={customers} 
                    onSave={handleSaveDocument} 
                    onAddCustomer={addCustomer}
                    setLastSaleId={setLastSaleId}
                />
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

      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Last Sale Receipt</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <Receipt
                sale={lastSale}
                store={stores.find((s) => s.id === lastSale.storeId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    