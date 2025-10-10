

'use client';

import { useData } from "@/lib/data-context";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { FileDown, MoreHorizontal, Printer, Trash2, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PurchaseTransaction, SaleTransaction, Store, Customer } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn, toDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt } from "@/components/app/sales/receipt";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { InvoiceOrQuotation } from "@/components/app/sales/invoice-quotation";
import { DocumentViewer } from "@/components/app/reports/document-viewer";
import { DataTable } from "@/components/app/products/data-table";
import { documentColumns } from "@/components/app/reports/document-columns";
import { EditEntitySheet } from "@/components/app/products/edit-entity-sheet";
import { DocumentForm } from "@/components/app/sales/document-form";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


const ReportTable = ({ data, total, periodLabel }: { data: any[], total: { sales: number, profit: number, totalQuantity: number }, periodLabel: string }) => (
    <Card className="shadow-drop-shadow-black">
      <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{periodLabel}</TableHead>
                <TableHead className="text-right">Total Items</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Profit (Sales - COGS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((report) => (
                  <TableRow key={report.key}>
                      <TableCell className="font-medium">{report.date}</TableCell>
                      <TableCell className="text-right">{report.totalQuantity}</TableCell>
                      <TableCell className="text-right">MMK {report.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">MMK {report.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
              ))}
              {data.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                          No reports found.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">{total.totalQuantity}</TableCell>
                <TableCell className="text-right font-bold">MMK {total.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right font-bold">MMK {total.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
      </CardContent>
    </Card>
);

const SalesByCustomerTable = ({ data }: { data: any[] }) => (
    <Card className="shadow-drop-shadow-black">
      <CardContent className="p-0">
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
      </CardContent>
    </Card>
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
        <Card className="shadow-drop-shadow-black">
          <CardContent className="p-0">
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
                            <TableCell className="font-medium">{format(purchaseDate, 'PP')}</TableCell>
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
          </CardContent>
        </Card>
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

const SalesHistoryTable = ({ data, stores, customers, onVoid, onPrintReceipt, onDelete }: { data: SaleTransaction[], stores: Store[], customers: Customer[], onVoid: (id: string) => void, onPrintReceipt: (sale: SaleTransaction) => void, onDelete: (id: string) => void }) => {
    const [voidCandidate, setVoidCandidate] = useState<string | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
    const { toast } = useToast();

    const handleVoid = () => {
        if (voidCandidate) {
            onVoid(voidCandidate);
            toast({ title: 'Success', description: 'Sale has been voided.' });
            setVoidCandidate(null);
        }
    };

    const handleDelete = () => {
        if (deleteCandidate) {
            onDelete(deleteCandidate);
            toast({ title: 'Success', description: 'Sale has been deleted.' });
            setDeleteCandidate(null);
        }
    };
    
    return (
    <>
        <Card className="shadow-drop-shadow-black">
          <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
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
                            <TableCell className="font-medium">{format(saleDate, 'PP')}</TableCell>
                            <TableCell>{stores.find(s => s.id === sale.storeId)?.name || 'NA'}</TableCell>
                            <TableCell>{customerName}</TableCell>
                            <TableCell>{sale.paymentType}</TableCell>
                            <TableCell>
                                <Badge variant={isVoided ? "destructive" : "secondary"} className="capitalize">{sale.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">MMK {sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                             <TableCell className="text-right">MMK {(sale.paidAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">MMK {(sale.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isVoided && !onDelete}>
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onPrintReceipt(sale)} disabled={isVoided}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print Receipt
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setVoidCandidate(sale.id)} disabled={isVoided}>
                                            <Undo2 className="mr-2 h-4 w-4" />
                                            Void Transaction
                                        </DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteCandidate(sale.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
                {data.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center h-24">
                            No sales history found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
          </CardContent>
        </Card>
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
          <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure you want to delete this sale?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the sale record. This will not adjust inventory. Use 'Void' to restock items if this was a completed sale.
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
    );
};


export default function ReportsPage() {
  const { sales, products, purchases, stores, suppliers, customers, voidSale, deletePurchase, deleteSale, updateSale, addCustomer, markInvoiceAsPaid, recordPayment } = useData();
  const [documentToPrint, setDocumentToPrint] = useState<{ type: 'receipt' | 'invoice' | 'quotation', sale: SaleTransaction } | null>(null);
  const [editingDocument, setEditingDocument] = useState<SaleTransaction | null>(null);
  const [paymentDocument, setPaymentDocument] = useState<SaleTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const { toast } = useToast();

  const filteredSales = useMemo(() => {
    if (selectedStore === 'all') return sales;
    return sales.filter(sale => sale.storeId === selectedStore);
  }, [sales, selectedStore]);

  const filteredPurchases = useMemo(() => {
    if (selectedStore === 'all') return purchases;
    return purchases.filter(purchase => purchase.storeId === selectedStore);
  }, [purchases, selectedStore]);


  const getReportData = (period: 'daily' | 'monthly') => {
    const reports: { [key: string]: { key: string, date: string, sales: number, cogs: number, profit: number, totalQuantity: number } } = {};
    
    const includedSales = filteredSales.filter(s => s.status === 'completed' || s.status === 'paid');
    
    includedSales.forEach(sale => {
        const d = toDate(sale.date);
        let key, dateLabel;

        if (period === 'daily') {
            key = d.toISOString().split('T')[0];
            dateLabel = format(d, 'PP');
        } else {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            dateLabel = format(d, 'MMMM yyyy');
        }

        if (!reports[key]) {
            reports[key] = { key, date: dateLabel, sales: 0, cogs: 0, profit: 0, totalQuantity: 0 };
        }

        reports[key].sales += sale.total;
        let saleCogs = 0;
        let saleQuantity = 0;
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if(product) saleCogs += product.buyPrice * item.quantity;
            saleQuantity += item.quantity;
        });
        reports[key].cogs += saleCogs;
        reports[key].profit = reports[key].sales - reports[key].cogs;
        reports[key].totalQuantity += saleQuantity;
    });

    const data = Object.values(reports).sort((a,b) => b.key.localeCompare(a.key));
    const total = data.reduce((acc, report) => {
        acc.sales += report.sales;
        acc.profit += report.profit;
        acc.totalQuantity += report.totalQuantity;
        return acc;
    }, { sales: 0, profit: 0, totalQuantity: 0 });

    return { data, total };
  };

  const getSalesByCustomerData = () => {
    const customerSales: { [key: string]: { customerId: string, customerName: string, totalSales: number } } = {};

    const includedSales = filteredSales.filter(s => s.status === 'completed' || s.status === 'paid');

    includedSales.forEach(sale => {
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
  const { data: monthlyReportsAll, total: monthlyTotalAll } = useMemo(() => getReportData('monthly'), [filteredSales, products]);
  
  const availableMonths = useMemo(() => {
      return [...new Set(monthlyReportsAll.map(report => report.date))];
  }, [monthlyReportsAll]);
  
  const filteredMonthlyReports = useMemo(() => {
    if (selectedMonth === 'all') {
      return monthlyReportsAll;
    }
    return monthlyReportsAll.filter(report => report.date === selectedMonth);
  }, [monthlyReportsAll, selectedMonth]);
  
  const filteredMonthlyTotal = useMemo(() => {
     return filteredMonthlyReports.reduce((acc, report) => {
        acc.sales += report.sales;
        acc.profit += report.profit;
        acc.totalQuantity += report.totalQuantity;
        return acc;
    }, { sales: 0, profit: 0, totalQuantity: 0 });
  }, [filteredMonthlyReports]);


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
        .filter(s => ['completed', 'paid', 'partially-paid', 'voided'].includes(s.status))
        .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  }, [filteredSales]);

  const invoiceHistory = useMemo(() => {
      return filteredSales
        .filter(s => s.status === 'invoice' || s.status === 'partially-paid' || s.status === 'paid' || (s.status === 'completed' && s.balance >= 0))
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
          data: dailyReports.map(r => ({ Period: r.date, 'Total Items': r.totalQuantity, Sales: r.sales, Profit: r.profit })),
          title: 'Daily Sales Report'
        };
      case 'monthly':
        return {
          data: filteredMonthlyReports.map(r => ({ Period: r.date, 'Total Items': r.totalQuantity, Sales: r.sales, Profit: r.profit })),
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
            Date: format(toDate(s.date), 'PP'),
            Store: stores.find(st => st.id === s.storeId)?.name || 'N/A',
            Customer: customers.find(c => c.id === s.customerId)?.name || 'N/A',
            Payment: s.paymentType,
            Status: s.status,
            Total: s.total,
            Paid: s.paidAmount,
            Balance: s.balance
          })),
          title: 'Sales History'
        };
       case 'invoice':
        return {
          data: invoiceHistory.map(s => ({
            Date: format(toDate(s.date), 'PP'),
            'Invoice #': s.id.slice(-6).toUpperCase(),
            Customer: customers.find(c => c.id === s.customerId)?.name || 'N/A',
            Status: s.status,
            Total: s.total,
            Paid: s.paidAmount,
            Balance: s.balance
          })),
          title: 'Invoice History'
        };
      case 'quotation':
        return {
          data: quotationHistory.map(s => ({
            Date: format(toDate(s.date), 'PP'),
            'Quotation #': `QUO-${s.id.slice(-6).toUpperCase()}`,
            Customer: customers.find(c => c.id === s.customerId)?.name || 'N/A',
            Total: s.total
          })),
          title: 'Quotation History'
        };
      case 'purchase':
        return {
          data: purchaseHistory.map(p => ({
            Date: format(toDate(p.date), 'PP'),
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

  const handleRecordPayment = async () => {
    if (!paymentDocument || paymentAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid payment amount.'});
      return;
    }
    if (paymentAmount > paymentDocument.balance) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Payment cannot exceed balance due.'});
      return;
    }

    try {
      await recordPayment(paymentDocument.id, paymentAmount);
      toast({ title: 'Payment Recorded', description: `MMK ${paymentAmount} recorded for invoice #${paymentDocument.id.slice(-6).toUpperCase()}`});
      setPaymentDocument(null);
      setPaymentAmount(0);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: (e as Error).message });
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

  const invoiceCols = documentColumns({
    customers,
    onEdit: (doc) => setEditingDocument(doc),
    onDelete: deleteSale,
    onPrint: (doc) => setDocumentToPrint({ type: 'invoice', sale: doc }),
    onMarkAsPaid: markInvoiceAsPaid,
    onRecordPayment: (doc) => {
      setPaymentDocument(doc);
      setPaymentAmount(doc.balance); // Pre-fill with remaining balance
    },
    type: 'invoice'
  });
  
  const quotationCols = documentColumns({
      customers,
      onEdit: (doc) => setEditingDocument(doc),
      onDelete: deleteSale,
      onPrint: (doc) => setDocumentToPrint({ type: 'quotation', sale: doc }),
      onMarkAsPaid: markInvoiceAsPaid,
      onRecordPayment: () => {},
      type: 'quotation'
  });


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
        <TabsContent value="daily" className="overflow-x-auto">
            <ReportTable data={dailyReports} total={dailyTotal} periodLabel="Date" />
        </TabsContent>
        <TabsContent value="monthly" className="overflow-x-auto space-y-4">
             <div className="flex justify-end">
                <Select onValueChange={setSelectedMonth} value={selectedMonth}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Filter by month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <ReportTable data={filteredMonthlyReports} total={filteredMonthlyTotal} period-label="Month" />
        </TabsContent>
        <TabsContent value="salesByCustomer" className="overflow-x-auto">
            <SalesByCustomerTable data={salesByCustomer} />
        </TabsContent>
          <TabsContent value="sales" className="overflow-x-auto">
            <SalesHistoryTable data={salesHistory} stores={stores} customers={customers} onVoid={voidSale} onPrintReceipt={(sale) => setDocumentToPrint({ type: 'receipt', sale })} onDelete={deleteSale} />
        </TabsContent>
        <TabsContent value="purchase" className="overflow-x-auto">
            <PurchaseHistoryTable data={purchaseHistory} stores={stores} suppliers={suppliers} onDelete={deletePurchase} />
        </TabsContent>
        <TabsContent value="invoice">
            <Card className="shadow-drop-shadow-black">
              <CardContent className="p-4 md:p-6">
                <DataTable columns={invoiceCols} data={invoiceHistory} filterColumnId="id" filterPlaceholder="Filter by number..." />
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="quotation">
            <Card className="shadow-drop-shadow-black">
              <CardContent className="p-4 md:p-6">
                <DataTable columns={quotationCols} data={quotationHistory} filterColumnId="id" filterPlaceholder="Filter by number..." />
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      {renderPrintDialog()}
      <EditEntitySheet
        title={`Edit ${editingDocument?.status === 'invoice' ? 'Invoice' : 'Quotation'}`}
        description="Update the details for this document."
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
      >
        {(onSuccess) => (
          <DocumentForm
            type={editingDocument?.status as 'invoice' | 'quotation'}
            stores={stores}
            customers={customers}
            onSave={(data) => updateSale(editingDocument!.id, data)}
            onAddCustomer={addCustomer}
            sale={editingDocument!}
            onSuccess={onSuccess}
          />
        )}
      </EditEntitySheet>
      <Dialog open={!!paymentDocument} onOpenChange={() => setPaymentDocument(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Record Payment for Invoice #{paymentDocument?.id.slice(-6).toUpperCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex justify-between font-medium">
                    <span>Balance Due:</span>
                    <span>MMK {paymentDocument?.balance.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="payment-amount">Payment Amount</Label>
                    <Input id="payment-amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))}/>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentDocument(null)}>Cancel</Button>
                <Button onClick={handleRecordPayment}>Record Payment</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

