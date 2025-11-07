
'use client';

import { useRef, useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function BarcodesPage() {
  const { products } = useData();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(false);

  const handlePrint = async () => {
    const input = printRef.current;
    if (!input) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find barcodes to print.',
      });
      return;
    }

    // Set a fixed width for the container for consistent PDF rendering
    input.style.width = '210mm'; // A4 width

    const canvas = await html2canvas(input, {
        scale: 4, // Increase scale significantly for better resolution
        useCORS: true,
    });

    // Revert the style change after canvas creation
    input.style.width = '';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const imgHeightInPdf = pdfWidth / ratio;
    
    let heightLeft = imgHeightInPdf;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
    }

    pdf.save('product-barcodes.pdf');
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
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Barcodes
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-4" ref={printRef}>
          <div className="grid grid-cols-3 gap-x-4 gap-y-8">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col items-center justify-center p-2 border rounded-lg break-inside-avoid">
                {showName && <p className="text-xs font-semibold text-center mb-1 truncate w-full">{product.name}</p>}
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
