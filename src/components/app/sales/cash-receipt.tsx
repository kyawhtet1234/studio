
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { SaleTransaction, Store, Customer, DocumentSettings } from '@/lib/types';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/lib/data-context';
import { toWords } from 'number-to-words';

interface CompanyInfo extends DocumentSettings {}

interface CashReceiptProps {
  sale: SaleTransaction;
  store: Store | undefined;
  customer: Customer | undefined;
}

const CashReceiptContent: React.FC<CashReceiptProps & { companyInfo: CompanyInfo | null }> = React.forwardRef(({ sale, store, customer, companyInfo }, ref) => {
    const documentTitle = 'CASH RECEIPT';
    const documentId = `CR-${sale.id.slice(-6).toUpperCase()}`;

    const headerStyle = {
      background: 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    };
    
    const titleStyle = {
        color: '#000000',
    };

    const tableHeaderStyle = {
        background: '#F5F5F5',
        color: 'black',
        fontWeight: 'bold',
    };
    
    const amountInWords = toWords(sale.paidAmount);

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className="bg-white text-gray-800 text-sm w-full font-sans p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-600">
             <div className="h-20 flex items-center relative w-1/3">
                {companyInfo?.companyLogo && (
                    <img src={companyInfo.companyLogo} alt="Company Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                )}
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold" style={titleStyle}>{documentTitle}</h1>
              <p className="text-gray-600"># {documentId}</p>
            </div>
        </div>

        {/* Company and Date Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-bold">{companyInfo?.companyName || 'Your Company'}</h2>
              <p className="whitespace-pre-line text-xs">{companyInfo?.companyAddress}</p>
              <p className="text-xs">{companyInfo?.companyPhone}</p>
            </div>
             <div className="text-right">
                <p><strong>Date:</strong> {format(new Date(sale.date as Date), 'PP')}</p>
                <p><strong>Invoice #:</strong> {sale.id.slice(-6).toUpperCase()}</p>
            </div>
        </div>

        {/* Receipt Body */}
        <div className="space-y-4 text-base mb-8">
            <p>
                Received from <strong className="font-bold underline decoration-dotted px-2">{customer?.name || 'Walk-in Customer'}</strong>
                the sum of <strong className="font-bold underline decoration-dotted px-2">MMK {sale.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
            <p>
                ( <span className="capitalize font-semibold">{amountInWords}</span> Kyats only )
            </p>
        </div>

        {/* Items Table */}
        <table className="w-full text-left table-auto mb-8">
            <thead>
                <tr style={tableHeaderStyle}>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map((item) => (
                <tr key={item.productId} className="border-b">
                    <td className="p-2 font-semibold">{item.name}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">MMK {item.sellPrice.toLocaleString()}</td>
                    <td className="p-2 text-right">MMK {item.total.toLocaleString()}</td>
                </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan={2}></td>
                    <td className="p-2 text-right font-bold">Subtotal:</td>
                    <td className="p-2 text-right">MMK {sale.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                    <td colSpan={2}></td>
                    <td className="p-2 text-right font-bold">Discount:</td>
                    <td className="p-2 text-right">- MMK {sale.discount.toLocaleString()}</td>
                </tr>
                <tr className="font-bold text-base bg-gray-100">
                    <td colSpan={2}></td>
                    <td className="p-2 text-right">Total:</td>
                    <td className="p-2 text-right">MMK {sale.total.toLocaleString()}</td>
                </tr>
                <tr className="font-bold text-base">
                    <td colSpan={2}></td>
                    <td className="p-2 text-right">Paid:</td>
                    <td className="p-2 text-right">MMK {sale.paidAmount.toLocaleString()}</td>
                </tr>
                 <tr className="font-bold text-base">
                    <td colSpan={2}></td>
                    <td className="p-2 text-right">Balance Due:</td>
                    <td className="p-2 text-right">MMK {sale.balance.toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>


        {/* Signature */}
        <div className="flex justify-end mt-16">
         <div className="text-center">
             <div className="mb-2 border-t-2 border-gray-400 border-solid w-48 ml-auto"></div>
             <p>Authorised Signatory</p>
         </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-xs border-t pt-4">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
        </div>

      </div>
    );
});
CashReceiptContent.displayName = 'CashReceiptContent';


export const CashReceipt: React.FC<CashReceiptProps> = ({ sale, store, customer }) => {
    const documentRef = React.useRef<HTMLDivElement>(null);
    const { settings } = useData();
    
    const companyInfo = settings.invoice;

    const handleDownload = async () => {
        const input = documentRef.current;
        if (!input) return;
        input.style.width = '800px';

        const canvas = await html2canvas(input, { scale: 2 });
        
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

        pdf.save(`cash_receipt_${sale.id.slice(-6)}.pdf`);
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
                <CashReceiptContent ref={documentRef} sale={sale} store={store} customer={customer} companyInfo={companyInfo || null} />
            </div>
        </div>
    );
}
