
'use client';

import { useRef, useState } from 'react';
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
  const printRef = useRef<HTMLDivElement>(null);
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

    // Use a timeout to allow the UI to update with the loader
    setTimeout(() => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // It's crucial to add a font that supports the characters you need.
            // jsPDF has built-in fonts that are limited. For Unicode, you must add your own.
            // Since we cannot add TTF files, we will rely on jsPDF's internal font handling,
            // which may depend on the browser/OS, but is the best we can do without adding assets.
            // Setting a standard font like 'Helvetica' is a fallback.
            pdf.setFont('Helvetica');


            const margin = 10;
            const pageW = pdf.internal.pageSize.getWidth();
            
            const cols = 3;
            const rows = 8;
            const itemsPerPage = cols * rows;

            const itemW = (pageW - margin * 2) / cols;
            const itemH = 35; // mm height for each barcode label area

            let itemCounter = 0;

            products.forEach((product) => {
                if (itemCounter > 0 && itemCounter % itemsPerPage === 0) {
                    pdf.addPage();
                }

                const pageIndex = Math.floor(itemCounter / itemsPerPage);
                const itemIndexOnPage = itemCounter % itemsPerPage;
                
                const colIndex = itemIndexOnPage % cols;
                const rowIndex = Math.floor(itemIndexOnPage / cols);
                
                const x = margin + colIndex * itemW;
                const y = margin + rowIndex * itemH;

                pdf.setFontSize(8);
                pdf.setTextColor(0, 0, 0);

                let textY = y + 5;

                if (showName) {
                    const splitName = pdf.splitTextToSize(product.name, itemW - 4);
                    pdf.text(splitName, x + itemW / 2, textY, { align: 'center' });
                    textY += (splitName.length * 3.5);
                }
                if (showPrice) {
                    pdf.text(`MMK ${product.sellPrice.toLocaleString()}`, x + itemW / 2, textY, { align: 'center' });
                    textY += 3.5;
                }
                
                // Create a temporary canvas for the barcode
                const barcodeCanvas = document.createElement('canvas');
                try {
                    JsBarcode(barcodeCanvas, product.sku, {
                        format: "CODE128",
                        width: 1.5,
                        height: 40,
                        fontSize: 12,
                        margin: 2,
                        displayValue: true,
                    });
                    const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
                    pdf.addImage(barcodeDataUrl, 'PNG', x + (itemW - 45) / 2, textY, 45, 15);
                } catch(e) {
                    console.error(`Failed to generate barcode for SKU: ${product.sku}`, e);
                }


                itemCounter++;
            });

            pdf.save('product-barcodes.pdf');
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'PDF Export Failed',
                description: 'An unexpected error occurred while generating the PDF.',
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, 100); // 100ms timeout
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
          <div ref={printRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
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
