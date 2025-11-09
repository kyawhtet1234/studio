
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
    if (!input || products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No barcodes to print.',
      });
      return;
    }

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // 10mm margin on each side
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    const allBarcodeElements = Array.from(input.querySelectorAll('.barcode-item'));
    
    // Estimate items per page
    // This is an estimation, real value depends on item name height
    const itemHeight = 35; // approximate height of one barcode item in mm
    const itemsPerRow = 3;
    const rowsPerPage = Math.floor(contentHeight / itemHeight);
    const itemsPerPage = itemsPerRow * rowsPerPage;

    for (let i = 0; i < allBarcodeElements.length; i += itemsPerPage) {
        const chunk = allBarcodeElements.slice(i, i + itemsPerPage);
        
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = `${contentWidth}mm`;
        
        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid grid-cols-3 gap-x-4 gap-y-8 p-4';
        
        chunk.forEach(el => gridContainer.appendChild(el.cloneNode(true)));
        tempContainer.appendChild(gridContainer);
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
            scale: 3,
            useCORS: true,
            width: tempContainer.offsetWidth,
            height: tempContainer.offsetHeight,
            windowWidth: tempContainer.scrollWidth,
            windowHeight: tempContainer.scrollHeight,
        });

        document.body.removeChild(tempContainer);
        
        if (i > 0) {
            pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
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
