
'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { useToast } from '@/hooks/use-toast';
import ReactDOMServer from 'react-dom/server';

export default function BarcodesPage() {
  const { products } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = () => {
    if (products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Products',
        description: 'There are no products to generate barcodes for.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not open print window. Please disable your pop-up blocker.' });
        setIsLoading(false);
        return;
      }
      
      printWindow.document.write('<html><head><title>Print Barcodes</title>');
      printWindow.document.write(`
        <style>
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
          }
          body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
          }
          .label-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-gap: 10px;
            page-break-inside: avoid;
          }
          .label {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            font-size: 10px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            page-break-inside: avoid;
            height: 100px; /* Fixed height for consistency */
          }
          .product-name {
            font-weight: bold;
            word-wrap: break-word;
            max-height: 2.5em; /* Limit name to 2 lines */
            overflow: hidden;
          }
          .product-sku {
            color: #555;
          }
          .product-price {
            font-weight: bold;
            font-size: 11px;
            margin-top: 2px;
          }
          svg {
             max-height: 40px;
          }
        </style>
      `);
      printWindow.document.write('</head><body><div class="label-grid">');

      products.forEach(product => {
        const barcodeHTML = ReactDOMServer.renderToString(
          <Barcode value={product.sku} width={1.2} height={25} fontSize={10} margin={2} />
        );
        const labelContent = `
          <div class="label">
            <div class="product-name">${product.name}</div>
            <div class="product-sku">${product.sku}</div>
            ${barcodeHTML}
            <div class="product-price">MMK ${product.sellPrice.toLocaleString()}</div>
          </div>
        `;
        printWindow.document.write(labelContent);
      });

      printWindow.document.write('</div></body></html>');
      printWindow.document.close();
      
      // Use a timeout to ensure all content and scripts for barcode generation are loaded
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setIsLoading(false);
      }, 500); // 500ms delay to allow barcodes to render

    } catch (error) {
      console.error('Failed to generate print page:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An unexpected error occurred while preparing the print page.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Product Barcodes">
        <Button onClick={handlePrint} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Generating...' : 'Print All Barcodes'}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            A preview of your product barcodes is shown below. Use the "Print All Barcodes" button to open a print-friendly page. From there, you can print directly or save as a PDF.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {products.slice(0, 12).map((product) => (
              <div
                key={product.id}
                className="barcode-item flex flex-col items-center justify-center p-2 border rounded-lg break-inside-avoid text-center"
              >
                <p className="text-xs font-semibold break-words w-full">{product.name}</p>
                <p className="text-[10px] text-muted-foreground">{product.sku}</p>
                <Barcode value={product.sku} width={1.5} height={30} fontSize={10} margin={2} />
                <p className="text-xs font-bold">MMK {product.sellPrice.toLocaleString()}</p>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              No products found to generate barcodes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
