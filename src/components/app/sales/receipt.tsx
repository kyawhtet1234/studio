
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SaleTransaction, Store } from '@/lib/types';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';

interface ReceiptProps {
  sale: SaleTransaction;
  store: Store | undefined;
}

const ReceiptContent: React.FC<ReceiptProps> = React.forwardRef(({ sale, store }, ref) => {
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className="p-4 bg-white text-black font-mono text-xs">
        <div className="text-center">
          <h2 className="text-base font-bold">{store?.name || 'CloudPOS'}</h2>
          <p>{store?.location}</p>
          <p>{format(new Date(sale.date as Date), 'PPpp')}</p>
        </div>
        <Separator className="my-2 bg-black" />
        <div className="space-y-1">
          {sale.items.map(item => (
            <div key={item.productId} className="grid grid-cols-12">
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
        </div>
        <Separator className="my-2 bg-black" />
        <p className="text-center mt-4">Thank you for your purchase!</p>
      </div>
    );
});
ReceiptContent.displayName = 'ReceiptContent';


export const Receipt: React.FC<ReceiptProps> = ({ sale, store }) => {
    const receiptRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (printContent) {
            const originalContents = document.body.innerHTML;
            const styles = Array.from(document.styleSheets)
                .map(styleSheet => {
                    try {
                        return Array.from(styleSheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('');
                    } catch (e) {
                        console.log('Access to stylesheet %s is denied. Skipping.', styleSheet.href);
                        return '';
                    }
                })
                .join('\n');

            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Receipt</title>');
                printWindow.document.write(`<style>${styles}</style>`);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    return (
        <div>
            <ReceiptContent ref={receiptRef} sale={sale} store={store} />
            <div className="mt-4 flex justify-end">
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                </Button>
            </div>
        </div>
    );
}
