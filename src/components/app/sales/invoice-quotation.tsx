
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SaleTransaction, Store, Customer } from '@/lib/types';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// LocalStorage Keys
const INVOICE_COMPANY_NAME_KEY = 'invoice-company-name';
const INVOICE_COMPANY_ADDRESS_KEY = 'invoice-company-address';
const INVOICE_COMPANY_PHONE_KEY = 'invoice-company-phone';
const INVOICE_COMPANY_LOGO_KEY = 'invoice-company-logo';
const INVOICE_TERMS_KEY = 'invoice-terms';
const INVOICE_PAYMENT_INFO_KEY = 'invoice-payment-info';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  logo: string | null;
  terms: string;
  paymentInfo: string;
}

interface InvoiceOrQuotationProps {
  sale: SaleTransaction;
  store: Store | undefined;
  customer: Customer | undefined;
  type: 'invoice' | 'quotation';
}

const InvoiceContent: React.FC<InvoiceOrQuotationProps & { companyInfo: CompanyInfo | null }> = React.forwardRef(({ sale, store, customer, type, companyInfo }, ref) => {
    const documentTitle = type === 'invoice' ? 'INVOICE' : 'QUOTATION';
    const documentId = type === 'invoice' ? sale.id.slice(-6).toUpperCase() : `QUO-${sale.id.slice(-6).toUpperCase()}`;

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className="p-8 bg-white text-black text-sm">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            {companyInfo?.logo && (
              <div className="mb-4">
                <Image src={companyInfo.logo} alt="Company Logo" width={150} height={75} className="object-contain" />
              </div>
            )}
            <h1 className="text-xl font-bold">{companyInfo?.name || 'Your Company'}</h1>
            <p className="whitespace-pre-line">{companyInfo?.address}</p>
            <p>{companyInfo?.phone}</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold uppercase">{documentTitle}</h1>
            <p><strong>#</strong>: {documentId}</p>
            <p><strong>Date</strong>: {format(new Date(sale.date as Date), 'PPP')}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-base font-semibold mb-2">Bill To:</h2>
          {customer ? (
            <>
              <p className="font-bold">{customer.name}</p>
              <p>{customer.phone}</p>
            </>
          ) : (
            <p>Walk-in Customer</p>
          )}
        </div>

        <table className="w-full text-left table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Item</th>
              <th className="p-2 text-right">Quantity</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map(item => (
              <tr key={item.productId} className="border-b">
                <td className="p-2">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-600">{item.sku}</p>
                </td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">MMK {item.sellPrice.toLocaleString()}</td>
                <td className="p-2 text-right">MMK {item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>MMK {sale.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>MMK {sale.discount.toLocaleString()}</span>
            </div>
            <Separator className="bg-black" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>MMK {sale.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {type === 'invoice' && (
             <div className="mt-8">
                <Separator className="my-4 bg-black/50" />
                <h3 className="font-bold mb-2">Payment Information</h3>
                <p className="whitespace-pre-line text-xs">{companyInfo?.paymentInfo}</p>
            </div>
        )}

        <div className="mt-8 text-xs text-gray-600">
          <h3 className="font-bold mb-2">Terms & Conditions</h3>
          <p className="whitespace-pre-line">{companyInfo?.terms}</p>
        </div>
      </div>
    );
});
InvoiceContent.displayName = 'InvoiceContent';


export const InvoiceOrQuotation: React.FC<InvoiceOrQuotationProps> = ({ sale, store, customer, type }) => {
    const documentRef = React.useRef<HTMLDivElement>(null);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

    useEffect(() => {
        // Must be in useEffect to avoid server/client mismatch with localStorage
        const info = {
          name: localStorage.getItem(INVOICE_COMPANY_NAME_KEY) || 'Your Company Name',
          address: localStorage.getItem(INVOICE_COMPANY_ADDRESS_KEY) || 'Your Company Address',
          phone: localStorage.getItem(INVOICE_COMPANY_PHONE_KEY) || '',
          logo: localStorage.getItem(INVOICE_COMPANY_LOGO_KEY),
          terms: localStorage.getItem(INVOICE_TERMS_KEY) || 'Thank you for your business.',
          paymentInfo: localStorage.getItem(INVOICE_PAYMENT_INFO_KEY) || 'Please make payments to the account below.',
        };
        setCompanyInfo(info);
    }, []);

    const handleDownload = async () => {
        const input = documentRef.current;
        if (!input) return;

        // Temporarily make the content wider for better PDF layout
        input.style.width = '1024px';

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

        if (height > pdfHeight) {
             height = pdfHeight;
        }
        
        pdf.addImage(imgData, 'PNG', 0, position, widthInPdf, heightInPdf);
        let remainingHeight = imgHeight * (widthInPdf / imgWidth) - height;

        while(remainingHeight > 0) {
            position = -height;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, widthInPdf, heightInPdf);
            remainingHeight -= height;
        }

        pdf.save(`${type}_${sale.id.slice(-6)}.pdf`);
    };

    return (
        <div className="bg-gray-200 p-4">
            <div className="flex justify-end mb-4">
                <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto border bg-white">
                <InvoiceContent ref={documentRef} sale={sale} store={store} customer={customer} type={type} companyInfo={companyInfo} />
            </div>
        </div>
    );
}

