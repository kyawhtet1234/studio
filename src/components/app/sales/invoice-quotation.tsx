

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SaleTransaction, Store, Customer, DocumentSettings } from '@/lib/types';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/lib/data-context';


interface CompanyInfo extends DocumentSettings {}

interface InvoiceOrQuotationProps {
  sale: SaleTransaction;
  store: Store | undefined;
  customer: Customer | undefined;
  type: 'invoice' | 'quotation';
}

const InvoiceContent: React.FC<InvoiceOrQuotationProps & { companyInfo: CompanyInfo | null }> = React.forwardRef(({ sale, store, customer, type, companyInfo }, ref) => {
    const documentTitle = type === 'invoice' ? 'INVOICE' : 'QUOTATION';
    const documentId = type === 'invoice' ? sale.id.slice(-6).toUpperCase() : `QUO-${sale.id.slice(-6).toUpperCase()}`;

    const headerStyle = {
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2), 0 6px 6px rgba(0, 0, 0, 0.23)',
    };
    
    const titleStyle = {
        color: '#000000',
    };
    
    const tableHeaderStyle = {
        background: '#333333',
        color: 'white',
    };
    
    const totalStyle = {
        background: '#333333',
        color: 'white',
    };

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className="bg-white text-gray-800 text-xs w-full">
        {/* Header */}
        <div className="relative h-48" style={headerStyle}>
          <div className="absolute inset-0 p-8 flex justify-between items-center">
            
            {/* Left side - Logo */}
             <div className="h-full flex items-center relative w-1/3">
                {companyInfo?.companyLogo && (
                    <Image src={companyInfo.companyLogo} alt="Company Logo" layout="fill" objectFit="contain" />
                )}
            </div>
            
            {/* Right side - Company Info */}
            <div className="text-right" style={titleStyle}>
              <h1 className="text-xl font-bold">{companyInfo?.companyName || 'Your Company'}</h1>
              <p className="text-[11px] whitespace-pre-line">{companyInfo?.companyAddress}</p>
              <p className="text-[11px]">{companyInfo?.companyPhone}</p>
            </div>

          </div>
        </div>

        <div className="p-8">
            {/* Invoice Info */}
            <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="col-span-2">
                    <p className="text-gray-500">Bill To:</p>
                    <h2 className="text-base font-bold">{customer?.name || 'Walk-in Customer'}</h2>
                    {customer?.phone && <p>{customer.phone}</p>}
                </div>
                <div className="text-left">
                    <h1 className="text-2xl font-extrabold uppercase">{documentTitle}</h1>
                    <p><strong>#</strong> {documentId}</p>
                    <p><strong>Date:</strong> {format(new Date(sale.date as Date), 'PP')}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left table-auto mb-8">
            <thead >
                <tr style={tableHeaderStyle}>
                <th className="p-2">#</th>
                <th className="p-2">Item</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map((item, index) => (
                <tr key={item.productId} className="border-b">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[10px] text-gray-500">{item.sku}</p>
                    </td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">MMK {item.sellPrice.toLocaleString()}</td>
                    <td className="p-2 text-right">MMK {item.total.toLocaleString()}</td>
                </tr>
                ))}
            </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
            <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>MMK {sale.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                <span>Discount:</span>
                <span>- MMK {sale.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base p-2 rounded-md" style={totalStyle}>
                <span>Total:</span>
                <span>MMK {sale.total.toLocaleString()}</span>
                </div>
            </div>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-8">
                 <div>
                    {type === 'invoice' && companyInfo?.paymentInfo && (
                        <>
                            <h3 className="font-bold mb-1">Payment Information</h3>
                            <p className="whitespace-pre-line text-[10px]">{companyInfo.paymentInfo}</p>
                        </>
                    )}
                 </div>
                 <div className="text-right">
                     <div className="mt-12 mb-2 border-t-2 border-gray-400 border-dashed w-40 ml-auto"></div>
                     <p>Authorised Sign</p>
                 </div>
            </div>
             {companyInfo?.terms && (
                <div className="mt-8 pt-4 border-t">
                    <h3 className="font-bold mb-1">Terms & Conditions</h3>
                    <p className="whitespace-pre-line text-[10px] text-gray-500">{companyInfo.terms}</p>
                </div>
            )}
             <div className="text-center mt-6 text-gray-500">
                <p>Thank you for your business!</p>
            </div>
        </div>

      </div>
    );
});
InvoiceContent.displayName = 'InvoiceContent';


export const InvoiceOrQuotation: React.FC<InvoiceOrQuotationProps> = ({ sale, store, customer, type }) => {
    const documentRef = React.useRef<HTMLDivElement>(null);
    const { settings } = useData();
    const companyInfo = type === 'invoice' ? settings.invoice : settings.quotation;

    const handleDownload = async () => {
        const input = documentRef.current;
        if (!input) return;

        // Temporarily make the content wider for better PDF layout
        input.style.width = '800px';

        const canvas = await html2canvas(input, { scale: 2 });
        
        // Revert style change
        input.style.width = '';
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const widthInPdf = pdfWidth;
        const heightInPdf = widthInPdf / ratio;
        
        let height = heightInPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, widthInPdf, heightInPdf);
        let remainingHeight = heightInPdf - pdfHeight;

        while(remainingHeight > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, widthInPdf, heightInPdf);
            remainingHeight -= pdfHeight;
        }

        pdf.save(`${type}_${sale.id.slice(-6)}.pdf`);
    };

    return (
        <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-end mb-4">
                <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto border shadow-lg">
                <InvoiceContent ref={documentRef} sale={sale} store={store} customer={customer} type={type} companyInfo={companyInfo || null} />
            </div>
        </div>
    );
}
