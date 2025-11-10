
'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileDown, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';


export default function BarcodesPage() {
  const { products } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportToExcel = () => {
    if (products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Products',
        description: 'There are no products to export.',
      });
      return;
    }
    setIsLoading(true);

    try {
        const dataToExport = products.map(product => ({
            SKU: product.sku,
            'Product Name': product.name,
            'Sell Price': product.sellPrice,
            'Buy Price': product.buyPrice
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 15 }, // SKU
            { wch: 40 }, // Product Name
            { wch: 15 }, // Sell Price
            { wch: 15 }  // Buy Price
        ];

        const date = format(new Date(), 'yyyy-MM-dd');
        XLSX.writeFile(workbook, `Products_Barcodes_${date}.xlsx`);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: (error as Error).message || 'An unexpected error occurred while creating the Excel file.',
        });
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Product Barcodes">
        <Button onClick={handleExportToExcel} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          {isLoading ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            A preview of your product barcodes is shown below. Use the "Export to Excel" button to download a file with all product data, which you can use with label printing software.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {products.slice(0, 12).map((product) => (
              <div key={product.id} className="barcode-item flex flex-col items-center justify-center p-2 border rounded-lg break-inside-avoid">
                <p className="text-xs font-semibold text-center mb-1 break-words w-full">{product.name}</p>
                <p className="text-xs text-center mb-1">MMK {product.sellPrice.toLocaleString()}</p>
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
