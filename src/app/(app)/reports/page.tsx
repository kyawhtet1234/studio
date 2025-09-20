
'use client';

import { useData } from "@/lib/data-context";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { useMemo } from "react";
import type { PurchaseTransaction, SaleTransaction } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';

const ReportTable = ({ data, periodLabel }: { data: any[], periodLabel: string }) => (
    <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{periodLabel}</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Profit (Sales - COGS)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((report) => (
                <TableRow key={report.date}>
                    <TableCell className="font-medium">{report.date}</TableCell>
                    <TableCell className="text-right">MMK {report.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">MMK {report.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
            ))}
             {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                        No reports found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
);

const PurchaseHistoryTable = ({ data, stores, suppliers }: { data: PurchaseTransaction[], stores: any[], suppliers: any[] }) => (
    <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((purchase) => {
                const purchaseDate = (purchase.date as Timestamp)?.toDate ? (purchase.date as Timestamp).toDate() : new Date(purchase.date);
                return (
                    <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchaseDate.toLocaleDateString()}</TableCell>
                        <TableCell>{stores.find(s => s.id === purchase.storeId)?.name || 'N/A'}</TableCell>
                        <TableCell>{suppliers.find(s => s.id === purchase.supplierId)?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">MMK {purchase.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                )
            })}
             {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        No purchase history found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
);

const SalesHistoryTable = ({ data, stores }: { data: SaleTransaction[], stores: any[] }) => (
    <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((sale) => {
                const saleDate = (sale.date as Timestamp)?.toDate ? (sale.date as Timestamp).toDate() : new Date(sale.date);
                return (
                    <TableRow key={sale.id}>
                        <TableCell className="font-medium">{saleDate.toLocaleDateString()}</TableCell>
                        <TableCell>{stores.find(s => s.id === sale.storeId)?.name || 'N/A'}</TableCell>
                        <TableCell className="text-right">MMK {sale.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">MMK {sale.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">MMK {sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                )
            })}
             {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        No sales history found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
);


export default function ReportsPage() {
  const { sales, products, purchases, stores, suppliers } = useData();

  const getReportData = (period: 'daily' | 'monthly') => {
    const reports: { [key: string]: { date: string, sales: number, cogs: number, profit: number } } = {};
    
    sales.forEach(sale => {
        const d = (sale.date as Timestamp)?.toDate ? (sale.date as Timestamp).toDate() : new Date(sale.date);
        const key = period === 'daily' 
            ? d.toISOString().split('T')[0] 
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        if (!reports[key]) {
            reports[key] = { date: key, sales: 0, cogs: 0, profit: 0 };
        }

        reports[key].sales += sale.total;
        let saleCogs = 0;
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if(product) saleCogs += product.buyPrice * item.quantity;
        });
        reports[key].cogs += saleCogs;
        reports[key].profit = reports[key].sales - reports[key].cogs;
    });

    return Object.values(reports).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const dailyReports = useMemo(() => getReportData('daily'), [sales, products]);
  const monthlyReports = useMemo(() => getReportData('monthly'), [sales, products]);
  
  const purchaseHistory = useMemo(() => {
      return [...purchases].sort((a, b) => {
        const dateA = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
        const dateB = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [purchases]);

  const salesHistory = useMemo(() => {
      return [...sales].sort((a, b) => {
        const dateA = (a.date as Timestamp)?.toDate ? (a.date as Timestamp).toDate() : new Date(a.date);
        const dateB = (b.date as Timestamp)?.toDate ? (b.date as Timestamp).toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [sales]);


  return (
    <div>
      <PageHeader title="Reports">
        <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
        </Button>
      </PageHeader>
      <Tabs defaultValue="daily">
        <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="sales">Sales History</TabsTrigger>
            <TabsTrigger value="purchase">Purchase History</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
            <ReportTable data={dailyReports} periodLabel="Date" />
        </TabsContent>
        <TabsContent value="monthly">
            <ReportTable data={monthlyReports} period-label="Month" />
        </TabsContent>
         <TabsContent value="sales">
            <SalesHistoryTable data={salesHistory} stores={stores} />
        </TabsContent>
        <TabsContent value="purchase">
            <PurchaseHistoryTable data={purchaseHistory} stores={stores} suppliers={suppliers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
