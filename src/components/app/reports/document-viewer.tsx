
'use client';

import { useState } from 'react';
import type { SaleTransaction, Store, Customer } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InvoiceOrQuotation } from '@/components/app/sales/invoice-quotation';
import { format } from 'date-fns';

interface DocumentViewerProps {
    type: 'invoice' | 'quotation';
    sales: SaleTransaction[];
    stores: Store[];
    customers: Customer[];
}

export function DocumentViewer({ type, sales, stores, customers }: DocumentViewerProps) {
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

    const selectedSale = sales.find(s => s.id === selectedSaleId);
    const selectedStore = selectedSale ? stores.find(s => s.id === selectedSale.storeId) : undefined;
    const selectedCustomer = selectedSale ? customers.find(c => c.id === selectedSale.customerId) : undefined;
    const title = type === 'invoice' ? 'View Invoices' : 'View Quotations';
    const description = type === 'invoice' ? 'Select an invoice to view or download it.' : 'Select a quotation to view or download it.';

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="max-w-md">
                    <Select onValueChange={setSelectedSaleId}>
                        <SelectTrigger>
                            <SelectValue placeholder={`Select a ${type}...`} />
                        </SelectTrigger>
                        <SelectContent>
                            {sales.map(sale => (
                                <SelectItem key={sale.id} value={sale.id}>
                                    {format(new Date(sale.date as Date), 'PPP')} - {customers.find(c=>c.id === sale.customerId)?.name || 'Walk-in'} - MMK {sale.total.toLocaleString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {selectedSale && (
                    <div className="pt-4 border-t">
                        <InvoiceOrQuotation
                            type={type}
                            sale={selectedSale}
                            store={selectedStore}
                            customer={selectedCustomer}
                        />
                    </div>
                )}
                 {!selectedSale && sales.length === 0 && (
                    <div className="text-center text-muted-foreground pt-8">
                        No {type}s found.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
