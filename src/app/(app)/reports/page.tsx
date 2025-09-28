
'use client';

import { useData } from "@/lib/data-context";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { FileDown, MoreHorizontal, Printer, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PurchaseTransaction, SaleTransaction, Store, Customer } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt } from "@/components/app/sales/receipt";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { InvoiceOrQuotation } from "@/components/app/sales/invoice-quotation";
import { DocumentViewer } from "@/components/app/reports/document-viewer";


const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

const ReportTable = ({ data, total, periodLabel }: { data: any[], total: { sales: number, profit: number }, periodLabel: string }) => (
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
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">MMK {total.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-bold">MMK {total.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
    </div>
);

const SalesByCustomerTable = ({ data }: { data: any[] }) => (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((report) => (
                    <TableRow key={report.customerId}>
                        <TableCell className="font-medium">{report.customerName}</TableCell>
                        <TableCell className="text-right">MMK {report.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                ))}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">
                            No sales with customers found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
);

const PurchaseHistoryTable = ({ data, stores, suppliers, onDelete }: { data: PurchaseTransaction[], stores: any[], suppliers: any[], onDelete: (id: string) => void }) => {
    const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
    const { toast } = useToast();

    const handleDelete = () => {
        if (deleteCandidate) {
            onDelete(deleteCandidate);
            toast({ title: 'Success', description: 'Purchase record has been deleted.' });
            setDeleteCandidate(null);
        }
    };
    
    return (
    <>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((purchase) => {
                    const purchaseDate = toDate(purchase.date);
                    return (
                        <TableRow key={purchase.id}>
                            <TableCell className="font-medium">{purchaseDate.toLocaleDateString()}</TableCell>
                            <TableCell>{stores.find(s => s.id === purchase.storeId)?.name || 'N/A'}</TableCell>
                            <TableCell>{suppliers.find(s => s.id === purchase.supplierId)?.name || 'N/A'}</TableCell>
                            <TableCell className="text-right">MMK {purchase.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                             <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteCandidate(purchase.id)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No purchase history found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the purchase record and adjust inventory levels accordingly.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    )
};

const SalesHistoryTable = ({ data, stores, customers, onVoid, onPrintReceipt }: { data: SaleTransaction[], stores: Store[], customers: Customer[], onVoid: (id: string) => void, onPrintReceipt: (sale: SaleTransaction) => void }) => {
    const [voidCandidate, setVoidCandidate] = useState<string | null>(null);
    const { toast } = useToast();

    const handleVoid = () => {
        if (voidCandidate) {
            onVoid(voidCandidate);
            toast({ title: 'Success', description: 'Sale has been voided.' });
            setVoidCandidate(null);
        }
    };
    
    return (
    <>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((sale) => {
                    const saleDate = toDate(sale.date);
                    const isVoided = sale.status === 'voided';
                    const customerName = customers.find(c => c.id === sale.customerId)?.name || 'N/A';
                    return (
                        <TableRow key={sale.id} className={cn(isVoided && "text-muted-foreground bg-muted/30")}>
                            <TableCell className="font-medium">{saleDate.toLocaleDateString()}</TableCell>
                            <TableCell>{stores.find(s => s.id === sale.storeId)?.name || 'NA'}</TableCell>
                            <TableCell>{customerName}</TableCell>
                            <TableCell>{sale.paymentType}</TableCell>
                            <TableCell>
                                <Badge variant={isVoided ? "destructive" : "secondary"} className="capitalize">{sale.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">MMK {sale.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">MMK {sale.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">MMK {sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isVoided}>
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onPrintReceipt(sale)}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print Receipt
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setVoidCandidate(sale.id)}>
                                            <Undo2 className="mr-2 h-4 w-4" />
                                            Void Transaction
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center h-24">
                            No sales history found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!voidCandidate} onOpenChange={() => setVoidCandidate(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to void this sale?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will mark the sale as void and restore the sold items to your inventory.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleVoid}>
                    Confirm Void
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    );
};


export default function ReportsPage() {
  const { sales, products, purchases, stores, suppliers, customers, voidSale, deletePurchase } = useData();
  const [documentToPrint, setDocumentToPrint] = useState<{ type: 'receipt' | 'invoice' | 'quotation', sale: SaleTransaction } | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('daily');

  const filteredSales = useMemo(() => {
    if (selectedStore === 'all') return sales;
    return sales.filter(sale => sale.storeId === selectedStore);
  }, [sales, selectedStore]);

  const filteredPurchases = useMemo(() => {
    if (selectedStore === 'all') return purchases;
    return purchases.filter(purchase => purchase.storeId === selectedStore);
  }, [purchases, selectedStore]);


  const getReportData = (period: 'daily' | 'monthly') => {
    const reports: { [key: string]: { date: string, sales: number, cogs: number, profit: number } } = {};
    
    // Only include completed sales for financial reports
    const completedSales = filteredSales.filter(s => s.status === 'completed');
    
    completedSales.forEach(sale => {
        const d = toDate(sale.date);
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

    const data = Object.values(reports).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = data.reduce((acc, report) => {
        acc.sales += report.sales;
        acc.profit += report.profit;
        return acc;
    }, { sales: 0, profit: 0 });

    return { data, total };
  };

  const getSalesByCustomerData = () => {
    const customerSales: { [key: string]: { customerId: string, customerName: string, totalSales: number } } = {};

    const completedSales = filteredSales.filter(s => s.status === 'completed');

    completedSales.forEach(sale => {
        if (!sale.customerId) return;

        if (!customerSales[sale.customerId]) {
            const customer = customers.find(c => c.id === sale.customerId);
            customerSales[sale.customerId] = {
                customerId: sale.customerId,
                customerName: customer ? customer.name : 'Unknown Customer',
                totalSales: 0
            };
        }
        customerSales[sale.customerId].totalSales += sale.total;
    });

    return Object.values(customerSales).sort((a, b) => b.totalSales - a.totalSales);
  };


  const { data: dailyReports, total: dailyTotal } = useMemo(() => getReportData('daily'), [filteredSales, products]);
  const { data: monthlyReports, total: monthlyTotal } = useMemo(() => getReportData('monthly'), [filteredSales, products]);
  const salesByCustomer = useMemo(() => getSalesByCustomerData(), [filteredSales, customers]);
  
  const purchaseHistory = useMemo(() => {
      return [...filteredPurchases].sort((a, b) => {
        const dateA = toDate(a.date);
        const dateB = toDate(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredPurchases]);

  const salesHistory = useMemo(() => {
      return filteredSales
        .filter(s => s.status === 'completed')
        .sort((a, b) => {
            const dateA = toDate(a.date);
            const dateB = toDate(b.date);
            return dateB.getTime() - dateA.getTime();
      });
  }, [filteredSales]);

  const invoiceHistory = useMemo(() => {
      return filteredSales
        .filter(s => s.status === 'invoice')
        .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  }, [filteredSales]);

  const quotationHistory = useMemo(() => {
      return filteredSales
        .filter(s => s.status === 'quotation')
        .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  }, [filteredSales]);

  const getActiveReportData = () => {
    switch (activeTab) {
      case 'daily':
        return { 
          data: dailyReports.map(r => ({ Period: r.date, Sales: r.sales, Profit: r.profit })),
          title: 'Daily Sales Report'
        };
      case 'monthly':
        return {
          data: monthlyReports.map(r => ({ Period: r.date, Sales: r.sales, Profit: r.profit })),
          title: 'Monthly Sales Report'
        };
      case 'salesByCustomer':
        return {
          data: salesByCustomer.map(r => ({ Customer: r.customerName, 'Total Sales': r.totalSales })),
          title: 'Sales By Customer'
        };
      case 'sales':
        return {
          data: salesHistory.map(s => ({
            Date: toDate(s.date).toLocaleDateString(),
            Store: stores.find(st => st.id === s.storeId)?.name || 'N/A',
            Customer: customers.find(c => c.id === s.customerId)?.name || 'N/A',
            Payment: s.paymentType,
            Status: s.status,
            Subtotal: s.subtotal,
            Discount: s.discount,
            Total: s.total
          })),
          title: 'Sales History'
        };
       case 'invoice':
        return {
          data: invoiceHistory.map(s => ({
            Date: toDate(s.date).toLocaleDateString(),
            Store: stores.find(st => st.id === s.storeId)?.name || 'N/A',
            Customer: customers.find(c => c.id === s.customerId)?.name || 'N/A',
            Total: s.total
          })),
          title: 'Invoice History'
        };
      case 'quotation':
        return {
          data: quotationHistory.map(s => ({
            Date: toDate(s.date).toLocaleDateString(),
            Store: stores.find(st => st.id === s.storeId)?.name || 'N/A',
            Customer: customers.find(c => c.id === s.customerId)?.name || 'N/A',
            Total: s.total
          })),
          title: 'Quotation History'
        };
      case 'purchase':
        return {
          data: purchaseHistory.map(p => ({
            Date: toDate(p.date).toLocaleDateString(),
            Store: stores.find(s => s.id === p.storeId)?.name || 'N/A',
            Supplier: suppliers.find(s => s.id === p.supplierId)?.name || 'N/A',
            Total: p.total
          })),
          title: 'Purchase History'
        };
      default:
        return { data: [], title: 'Report' };
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const { data, title } = getActiveReportData();
    if (data.length === 0) return;

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(title, 14, 16);
      autoTable(doc, {
        head: [Object.keys(data[0])],
        body: data.map(row => Object.values(row)),
        startY: 20,
      });
      doc.save(`${title.replace(/ /g, '_')}.pdf`);
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, `${title.replace(/ /g, '_')}.xlsx`);
    }
  };

  const renderPrintDialog = () => {
    if (!documentToPrint) return null;

    const { type, sale } = documentToPrint;
    const store = stores.find((s) => s.id === sale.storeId);
    const customer = customers.find((c) => c.id === sale.customerId);

    return (
      <Dialog open={!!documentToPrint} onOpenChange={() => setDocumentToPrint(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Print Document</DialogTitle>
          </DialogHeader>
          {type === 'receipt' && <Receipt sale={sale} store={store} />}
          {(type === 'invoice' || type === 'quotation') && <InvoiceOrQuotation type={type} sale={sale} store={store} customer={customer} />}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div>
      <PageHeader title="Reports">
        <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={setSelectedStore} value={selectedStore}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by store" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>Export as Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </PageHeader>
      <Tabs defaultValue="daily" onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto self-start h-auto">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="salesByCustomer">Sales By Customer</TabsTrigger>
            <TabsTrigger value="sales">Sales History</TabsTrigger>
            <TabsTrigger value="purchase">Purchase History</TabsTrigger>
            <TabsTrigger value="invoice">Invoices</TabsTrigger>
            <TabsTrigger value="quotation">Quotations</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
            <ReportTable data={dailyReports} total={dailyTotal} periodLabel="Date" />
        </TabsContent>
        <TabsContent value="monthly">
            <ReportTable data={monthlyReports} total={monthlyTotal} period-label="Month" />
        </TabsContent>
        <TabsContent value="salesByCustomer">
            <SalesByCustomerTable data={salesByCustomer} />
        </TabsContent>
         <TabsContent value="sales">
            <SalesHistoryTable data={salesHistory} stores={stores} customers={customers} onVoid={voidSale} onPrintReceipt={(sale) => setDocumentToPrint({ type: 'receipt', sale })} />
        </TabsContent>
        <TabsContent value="purchase">
            <PurchaseHistoryTable data={purchaseHistory} stores={stores} suppliers={suppliers} onDelete={deletePurchase} />
        </TabsContent>
        <TabsContent value="invoice">
            <DocumentViewer type="invoice" sales={invoiceHistory} stores={stores} customers={customers} />
        </TabsContent>
        <TabsContent value="quotation">
            <DocumentViewer type="quotation" sales={quotationHistory} stores={stores} customers={customers} />
        </TabsContent>
      </Tabs>
      {renderPrintDialog()}
    </div>
  );
}
