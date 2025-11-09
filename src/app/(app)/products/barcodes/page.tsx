
'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function BarcodesPage() {
  const { products } = useData();
  const { toast } = useToast();
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    if (products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No barcodes to print.',
      });
      return;
    }
    setIsLoading(true);

    // Allow UI to update before blocking with PDF generation
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });
        
        // jsPDF does not embed non-standard fonts by default.
        // For Unicode characters like Burmese, we must rely on the viewing environment's fonts.
        // We set a common font and let the viewer handle it.
        pdf.setFont('Helvetica', 'sans-serif');

        const margin = 10;
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        
        const cols = 3;
        const itemW = (pageW - margin * 2) / cols;
        const itemH = 35; 
        const rows = Math.floor((pageH - margin * 2) / itemH);
        const itemsPerPage = cols * rows;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const pageIndex = Math.floor(i / itemsPerPage);
            if (pageIndex > 0 && i % itemsPerPage === 0) {
                pdf.addPage();
            }

            const itemIndexOnPage = i % itemsPerPage;
            const colIndex = itemIndexOnPage % cols;
            const rowIndex = Math.floor(itemIndexOnPage / cols);
            
            const x = margin + colIndex * itemW;
            const y = margin + rowIndex * itemH;

            // --- Text rendering ---
            pdf.setFontSize(8);
            let textY = y + 5;
            
            if (showName) {
                const nameLines = pdf.splitTextToSize(product.name, itemW - 4);
                pdf.text(nameLines, x + itemW / 2, textY, { align: 'center' });
                textY += (nameLines.length * 3);
            }
            if (showPrice) {
                pdf.text(`MMK ${product.sellPrice.toLocaleString()}`, x + itemW / 2, textY, { align: 'center' });
                textY += 4;
            }

            // --- Barcode rendering ---
            const canvas = document.createElement('canvas');
            try {
              JsBarcode(canvas, product.sku, {
                  format: "CODE128",
                  width: 1.5,
                  height: 40,
                  fontSize: 12,
                  displayValue: true,
                  margin: 0,
              });
              
              const barcodeImgData = canvas.toDataURL('image/png');
              const barcodeImgWidth = itemW * 0.8;
              const barcodeImgHeight = (barcodeImgWidth / canvas.width) * canvas.height;
              const barcodeX = x + (itemW - barcodeImgWidth) / 2;
              pdf.addImage(barcodeImgData, 'PNG', barcodeX, textY, barcodeImgWidth, barcodeImgHeight);

            } catch (e) {
              console.error(`Failed to generate barcode for SKU: ${product.sku}`, e);
            }
        }

        pdf.save('product-barcodes.pdf');
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'PDF Export Failed',
            description: (error as Error).message || 'An unexpected error occurred.',
        });
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Product Barcodes">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="show-name" checked={showName} onCheckedChange={(checked) => setShowName(!!checked)} />
            <Label htmlFor="show-name">Show Name</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="show-price" checked={showPrice} onCheckedChange={(checked) => setShowPrice(!!checked)} />
            <Label htmlFor="show-price">Show Price</Label>
          </div>
          <Button onClick={handlePrint} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            {isLoading ? 'Generating...' : 'Export to PDF'}
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {products.map((product) => (
              <div key={product.id} className="barcode-item flex flex-col items-center justify-center p-2 border rounded-lg break-inside-avoid">
                {showName && <p className="text-xs font-semibold text-center mb-1 break-words w-full">{product.name}</p>}
                {showPrice && <p className="text-xs text-center mb-1">MMK {product.sellPrice.toLocaleString()}</p>}
                <Barcode 
                    value={product.sku}
                    width={1.5}
                    height={40}
                    fontSize={12}
                    margin={2}
                />
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
