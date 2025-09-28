
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

    const isQuotation = type === 'quotation';
    
    const headerStyle = {
        backgroundColor: isQuotation ? '#B8860B' : 'hsl(var(--primary))',
        backgroundImage: isQuotation ? 'linear-gradient(135deg, #F0E68C 0%, #B8860B 100%)' : undefined,
    };
    
    const titleStyle = {
        color: isQuotation ? '#B8860B' : 'hsl(var(--primary))',
    };
    
    const tableHeaderStyle = {
        backgroundColor: isQuotation ? '#B8860B' : 'hsl(var(--primary))',
    };
    
    const totalStyle = {
        backgroundColor: isQuotation ? '#B8860B' : 'hsl(var(--primary))',
        color: isQuotation ? '#FFFFFF' : 'hsl(var(--primary-foreground))',
    };

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className="bg-white text-gray-800 text-sm w-full">
        {/* Header with geometric shapes */}
        <div className="relative h-48">
          <div
            className="absolute bottom-0 left-0 w-full h-32"
            style={headerStyle}
          ></div>
          <div className="absolute top-0 left-0 p-8 w-full flex justify-between items-center">
            <div className="flex items-center gap-4">
              {companyInfo?.logo && (
                <div className="bg-white p-2 rounded-md shadow-md w-24 h-24 flex items-center justify-center">
                  <Image src={companyInfo.logo} alt="Company Logo" width={80} height={80} className="object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">{companyInfo?.name || 'Your Company'}</h1>
                <p className="text-white text-xs whitespace-pre-line">{companyInfo?.address}</p>
                <p className="text-white text-xs">{companyInfo?.phone}</p>
              </div>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-8 bg-white opacity-50"></div>
                <div className="w-4 h-8 bg-white opacity-75"></div>
                <div className="w-4 h-8 bg-white"></div>
            </div>
          </div>
        </div>

        <div className="p-8">
            {/* Invoice Info */}
            <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="col-span-2">
                    <p className="text-gray-500">Bill To:</p>
                    <h2 className="text-lg font-bold">{customer?.name || 'Walk-in Customer'}</h2>
                    {customer?.phone && <p>{customer.phone}</p>}
                </div>
                <div className="text-left">
                    <h1 className="text-3xl font-extrabold uppercase" style={titleStyle}>{documentTitle}</h1>
                    <p><strong>#</strong> {documentId}</p>
                    <p><strong>Date:</strong> {format(new Date(sale.date as Date), 'PPP')}</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left table-auto mb-8">
            <thead >
                <tr style={tableHeaderStyle} className="text-white">
                <th className="p-3">#</th>
                <th className="p-3">Item</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map((item, index) => (
                <tr key={item.productId} className="border-b">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.sku}</p>
                    </td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">MMK {item.sellPrice.toLocaleString()}</td>
                    <td className="p-3 text-right">MMK {item.total.toLocaleString()}</td>
                </tr>
                ))}
            </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
            <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>MMK {sale.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                <span>Discount:</span>
                <span>- MMK {sale.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg p-3 rounded-md" style={totalStyle}>
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
                            <h3 className="font-bold mb-2">Payment Information</h3>
                            <p className="whitespace-pre-line text-xs">{companyInfo.paymentInfo}</p>
                        </>
                    )}
                 </div>
                 <div className="text-right">
                     <div className="mt-16 mb-2 border-t-2 border-gray-400 border-dashed w-48 ml-auto"></div>
                     <p>Authorised Sign</p>
                 </div>
            </div>
             {companyInfo?.terms && (
                <div className="mt-12 pt-8 border-t">
                    <h3 className="font-bold mb-2">Terms & Conditions</h3>
                    <p className="whitespace-pre-line text-xs text-gray-500">{companyInfo.terms}</p>
                </div>
            )}
             <div className="text-center mt-8 text-gray-500">
                <p>Thank you for your business!</p>
            </div>
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
                <InvoiceContent ref={documentRef} sale={sale} store={store} customer={customer} type={type} companyInfo={companyInfo} />
            </div>
        </div>
    );
}
