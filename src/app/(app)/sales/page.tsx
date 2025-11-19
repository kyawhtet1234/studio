
'use client';

import { PageHeader } from "@/components/app/page-header";
import { SalesForm } from "@/components/app/sales/sales-form";
import { DocumentForm } from "@/components/app/sales/document-form";
import type { SaleTransaction } from '@/lib/types';
import { useData } from "@/lib/data-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, type ReceiptHandle } from "@/components/app/sales/receipt";


export default function SalesPage() {
  const { addSale, stores, customers, addCustomer, sales: allSales } = useData();
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const receiptRef = useRef<ReceiptHandle>(null);

  const handleSaveDocument = async (docData: Omit<SaleTransaction, 'id'>) => {
    const newId = await addSale(docData);
    if (docData.status === 'completed') {
      setLastSaleId(newId as string);
    }
    return newId;
  };
  
  const lastSale = allSales.find(s => s.id === lastSaleId);
  
  useEffect(() => {
    if (lastSaleId) {
      setIsReceiptDialogOpen(true);
    }
  }, [lastSaleId]);

  const handleDialogChange = (open: boolean) => {
    setIsReceiptDialogOpen(open);
    if (!open) {
        setLastSaleId(null);
    }
  }

  const handlePrint = () => {
    receiptRef.current?.handlePrint();
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

      <Dialog open={isReceiptDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Last Sale Receipt</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <Receipt
                ref={receiptRef}
                sale={lastSale}
                store={stores.find((s) => s.id === lastSale.storeId)}
            />
          )}
          <DialogFooter>
              <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
