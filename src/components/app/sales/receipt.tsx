
'use client';

import React from 'react';
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
      <div ref={ref as React.Ref<HTMLDivElement>} id="receipt-content" className="p-4 bg-white text-black font-mono text-xs w-full max-w-[300px] mx-auto">
        <div className="text-center">
          {logo && (
            <div className="mb-2 flex justify-center">
              <Image src={logo} alt="Company Logo" width={80} height={80} className="object-contain" style={{ maxHeight: '60px', width: 'auto'}}/>
            </div>
          )}
          <h2 className="text-sm font-bold">{store?.name || 'CloudPOS'}</h2>
          <p className="text-[10px]">{store?.location}</p>
          <p className="text-[10px]">{format(new Date(sale.date as Date), 'PPpp')}</p>
        </div>
        <Separator className="my-2 bg-black border-dashed" />
        <div className="space-y-1">
          {sale.items.map(item => (
            <div key={`${item.productId}-${item.variant_name}`}>
                <p>{item.name} {item.variant_name && `(${item.variant_name})`}</p>
                <div className="flex justify-between">
                    <p className="pl-2">{item.quantity} x MMK {item.sellPrice.toLocaleString()}</p>
                    <p>MMK {item.total.toLocaleString()}</p>
                </div>
            </div>
          ))}
        </div>
        <Separator className="my-2 bg-black border-dashed" />
        <div className="space-y-1">
          <div className="flex justify-between">
            <p>Subtotal:</p>
            <p>MMK {sale.subtotal.toLocaleString()}</p>
          </div>
          <div className="flex justify-between">
            <p>Discount:</p>
            <p>- MMK {sale.discount.toLocaleString()}</p>
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
        <Separator className="my-2 bg-black border-dashed" />
        <p className="text-center mt-4 text-[10px]">Thank you for your purchase!</p>
      </div>
    );
});
ReceiptContent.displayName = 'ReceiptContent';


export const Receipt: React.FC<ReceiptProps> = ({ sale, store }) => {
    const { settings } = useData();
    const logo = settings.receipt?.companyLogo || null;

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-content')?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Receipt</title>');
                printWindow.document.write(`
                    <style>
                        @media print {
                            body { 
                                margin: 0; 
                                -webkit-print-color-adjust: exact; /* Chrome, Safari */
                                color-adjust: exact; /* Firefox */
                            }
                            #print-button { display: none; }
                        }
                        body { 
                            font-family: monospace; 
                            font-size: 10pt; 
                            color: black; 
                            max-width: 300px;
                            margin: auto;
                        }
                        .p-4 { padding: 1rem; }
                        .bg-white { background-color: white; }
                        .text-black { color: black; }
                        .font-mono { font-family: monospace; }
                        .text-xs { font-size: 0.75rem; }
                        .text-[10px] { font-size: 10px; }
                        .text-center { text-align: center; }
                        .text-sm { font-size: 0.875rem; }
                        .font-bold { font-weight: 700; }
                        .mb-2 { margin-bottom: 0.5rem; }
                        .flex { display: flex; }
                        .justify-center { justify-content: center; }
                        .object-contain { object-fit: contain; }
                        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
                        .my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
                        .bg-black { background-color: black; height: 1px; border: 0; }
                        .border-dashed { border-style: dashed; }
                        .space-y-1 > * + * { margin-top: 0.25rem; }
                        .justify-between { justify-content: space-between; }
                        .mt-4 { margin-top: 1rem; }
                        img { max-height: 60px; width: auto; }
                        .pl-2 { padding-left: 0.5rem; }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    return (
        <div className="w-full">
            <div className="overflow-y-auto max-h-[60vh] border rounded-lg bg-gray-100 p-4">
               <ReceiptContent sale={sale} store={store} logo={logo} />
            </div>
            <div className="mt-4 flex justify-end">
                <Button onClick={handlePrint} id="print-button">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                </Button>
            </div>
        </div>
    );
}
