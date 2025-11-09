
'use client';

import { useRef, useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import html2canvas from 'html2canvas';
import { Product } from '@/lib/types';

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

        const margin = 10; // mm
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        
        const cols = 3;
        const itemW = (pageW - margin * 2) / cols;
        const itemH = 35; // mm height for each barcode label area
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

            // Create a hidden div for each barcode to render it
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.width = `${itemW * 3.78}px`; // Convert mm to pixels for canvas
            container.style.height = `${itemH * 3.78}px`;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            container.style.background = 'white';
            
            let content = '';
            if (showName) content += `<div style="font-size: 24px; text-align: center; margin-bottom: 4px; word-break: break-word;">${product.name}</div>`;
            if (showPrice) content += `<div style="font-size: 24px; text-align: center; margin-bottom: 4px;">MMK ${product.sellPrice.toLocaleString()}</div>`;
            
            // Generate barcode SVG string
            const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            new Barcode(barcodeSvg, product.sku, {
                format: "CODE128",
                width: 1.5,
                height: 40,
                fontSize: 12,
                displayValue: true,
            });

            content += barcodeSvg.outerHTML;
            container.innerHTML = content;
            document.body.appendChild(container);

            const canvas = await html2canvas(container, {
                scale: 2, // Use a higher scale for better quality
                useCORS: true,
                backgroundColor: null, // Transparent background
            });
            
            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;

            const pdfImageWidth = itemW - 4; // Add some padding
            const pdfImageHeight = pdfImageWidth / ratio;
            
            const imageX = x + (itemW - pdfImageWidth) / 2;
            const imageY = y + (itemH - pdfImageHeight) / 2;

            pdf.addImage(imgData, 'PNG', imageX, imageY, pdfImageWidth, pdfImageHeight);
        }

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
