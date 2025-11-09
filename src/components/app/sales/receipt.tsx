
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SaleTransaction, Store } from '@/lib/types';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { useData } from '@/lib/data-context';

interface ReceiptProps {
  sale: SaleTransaction;
  store: Store | undefined;
}

const ReceiptContent: React.FC<ReceiptProps & { logo: string | null }> = React.forwardRef(({ sale, store, logo }, ref) => {
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className="p-4 bg-white text-black font-mono text-xs">
        <div className="text-center">
          {logo && (
            <div className="mb-4 flex justify-center">
              <Image src={logo} alt="Company Logo" width={128} height={128} className="object-contain" style={{ maxHeight: '80px', width: 'auto'}}/>
            </div>
          )}
          <h2 className="text-base font-bold">{store?.name || 'CloudPOS'}</h2>
          <p>{store?.location}</p>
          <p>{format(new Date(sale.date as Date), 'PPpp')}</p>
        </div>
        <Separator className="my-2 bg-black" />
        <div className="space-y-1">
          {sale.items.map(item => (
            <div key={`${item.productId}-${item.variant_name}`} className="grid grid-cols-12">
              <div className="col-span-8">
                <p>{item.name}</p>
                <p className="pl-2">{item.quantity} x MMK {item.sellPrice.toLocaleString()}</p>
              </div>
              <p className="col-span-4 text-right">MMK {item.total.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <Separator className="my-2 bg-black" />
        <div className="space-y-1">
          <div className="flex justify-between">
            <p>Subtotal:</p>
            <p>MMK {sale.subtotal.toLocaleString()}</p>
          </div>
          <div className="flex justify-between">
            <p>Discount:</p>
            <p>MMK {sale.discount.toLocaleString()}</p>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <p>Total:</p>
            <p>MMK {sale.total.toLocaleString()}</p>
          </div>
          <Separator className="my-1 bg-black/50 border-dashed" />
           <div className="flex justify-between">
            <p>Paid With:</p>
            <p>{sale.paymentType}</p>
          </div>
        </div>
        <Separator className="my-2 bg-black" />
        <p className="text-center mt-4">Thank you for your purchase!</p>
      </div>
    );
});
ReceiptContent.displayName = 'ReceiptContent';


export const Receipt: React.FC<ReceiptProps> = ({ sale, store }) => {
    const receiptRef = React.useRef<HTMLDivElement>(null);
    const { settings } = useData();
    const logo = settings.receipt?.companyLogo || null;


    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Receipt</title>');
                // Simple styles for printing
                printWindow.document.write(`
                    <style>
                        body { font-family: monospace; font-size: 10pt; color: black; }
                        .p-4 { padding: 1rem; }
                        .bg-white { background-color: white; }
                        .text-black { color: black; }
                        .font-mono { font-family: monospace; }
                        .text-xs { font-size: 0.75rem; }
                        .text-center { text-align: center; }
                        .text-base { font-size: 1rem; }
                        .font-bold { font-weight: 700; }
                        .mb-4 { margin-bottom: 1rem; }
                        .flex { display: flex; }
                        .justify-center { justify-content: center; }
                        .object-contain { object-fit: contain; }
                        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
                        .bg-black { background-color: black; height: 1px; border: 0; }
                        .space-y-1 > * + * { margin-top: 0.25rem; }
                        .grid { display: grid; }
                        .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
                        .col-span-8 { grid-column: span 8 / span 8; }
                        .col-span-4 { grid-column: span 4 / span 4; }
                        .pl-2 { padding-left: 0.5rem; }
                        .text-right { text-align: right; }
                        .justify-between { justify-content: space-between; }
                        .text-sm { font-size: 0.875rem; }
                        .mt-4 { margin-top: 1rem; }
                        img { max-height: 80px; width: auto; }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                
                // Use a timeout to ensure images are loaded before printing
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            }
        }
    };

    return (
        <div>
            <ReceiptContent ref={receiptRef} sale={sale} store={store} logo={logo} />
            <div className="mt-4 flex justify-end">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                </Button>
            </div>
        </div>
    );
}

    