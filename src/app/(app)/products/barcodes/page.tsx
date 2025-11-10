
'use client';

import { useState, useRef } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileDown, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function BarcodesPage() {
  const { products } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // A hidden container to render labels for PDF generation
  const printContainerRef = useRef<HTMLDivElement>(null);

  const handleExportToPDF = async () => {
    if (products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Products',
        description: 'There are no products to export barcodes for.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const labelsPerRow = 4;
      const labelsPerCol = 8;
      const labelWidth = (pageWidth - margin * 2) / labelsPerRow;
      const labelHeight = (pageHeight - margin * 2) / labelsPerCol;
      let x = margin;
      let y = margin;
      let labelCount = 0;

      const allLabelElements = printContainerRef.current?.children;
      if (!allLabelElements) {
        throw new Error("Could not find the hidden label container.");
      }

      for (let i = 0; i < allLabelElements.length; i++) {
        const labelEl = allLabelElements[i] as HTMLElement;

        const canvas = await html2canvas(labelEl, {
          scale: 3, // Increase scale for higher resolution
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        doc.addImage(imgData, 'PNG', x, y, labelWidth, labelHeight);
        
        x += labelWidth;
        labelCount++;
        
        if (labelCount % labelsPerRow === 0) {
          x = margin;
          y += labelHeight;
        }

        if (y + labelHeight > pageHeight - margin) {
          if (i < allLabelElements.length - 1) { // Don't add a new page if it's the last item
            doc.addPage();
            x = margin;
            y = margin;
          }
        }
      }

      doc.save('barcodes.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An unexpected error occurred while generating the PDF.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Product Barcodes">
        <Button onClick={handleExportToPDF} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Generating...' : 'Export to PDF'}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            A preview of your product barcodes is shown below. Use the "Export to PDF" button to download a printable file.
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
      
      {/* Hidden container for rendering all labels for PDF generation */}
      <div ref={printContainerRef} className="absolute -left-[9999px] top-0" aria-hidden="true">
        {products.map(product => (
          <div
            key={`print-${product.id}`}
            style={{ width: '250px', padding: '10px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: 'white', border: '1px solid #eee' }}
          >
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>{product.name}</p>
            <p style={{ fontSize: '10px', color: '#666', margin: '2px 0' }}>{product.sku}</p>
            <Barcode value={product.sku} width={1.5} height={30} fontSize={10} margin={2} />
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0 0 0' }}>MMK {product.sellPrice.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
