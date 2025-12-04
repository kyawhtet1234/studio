
'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import JsBarcode from 'jsbarcode';
import type { Product } from '@/lib/types';

interface ProductToPrint {
  product: Product;
  quantity: number;
}

export default function BarcodesPage() {
  const { products } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showName, setShowName] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  
  const [productsToPrint, setProductsToPrint] = useState<ProductToPrint[]>([]);
  const [searchSku, setSearchSku] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState<number | string>(1);

  useEffect(() => {
    if (searchSku) {
      const product = products.find(p => p.sku.toLowerCase().startsWith(searchSku.toLowerCase()));
      setFoundProduct(product || null);
    } else {
      setFoundProduct(null);
    }
  }, [searchSku, products]);

  const handleAddItem = () => {
    if (!foundProduct) {
      toast({ variant: 'destructive', title: 'Product not found' });
      return;
    }
    if (productsToPrint.some(p => p.product.id === foundProduct.id)) {
      toast({ variant: 'destructive', title: 'Product already in list' });
      return;
    }
    const qty = Number(quantityToAdd);
    if (qty <= 0) {
      toast({ variant: 'destructive', title: 'Invalid quantity' });
      return;
    }
    setProductsToPrint(prev => [...prev, { product: foundProduct, quantity: qty }]);
    setSearchSku('');
    setQuantityToAdd(1);
    setFoundProduct(null);
  };

  const handleRemoveItem = (productId: string) => {
    setProductsToPrint(prev => prev.filter(p => p.product.id !== productId));
  };
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setProductsToPrint(prev => 
        prev.map(p => p.product.id === productId ? { ...p, quantity: newQuantity } : p)
    );
  };

  const handlePrint = () => {
    if (productsToPrint.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Products Selected',
        description: 'Please add products to the print list.',
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
          @page {
            size: A4;
            margin: 5mm;
          }
          body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
          }
          .label {
            width: 25mm;
            height: 15mm;
            border: 0.1mm solid #000;
            padding: 1mm;
            margin: 1mm;
            text-align: center;
            font-size: 5pt;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            page-break-inside: avoid;
            float: left; /* Fallback for older browsers */
          }
          .product-name {
            font-weight: bold;
            word-wrap: break-word;
            line-height: 1;
            margin-bottom: 0.5mm;
            max-height: 2.2mm;
            overflow: hidden;
          }
          .product-sku {
            font-size: 4.5pt;
            line-height: 1;
          }
          .product-price {
            font-weight: bold;
            font-size: 5pt;
            margin-top: 0.5mm;
            line-height: 1;
          }
          .barcode-container {
            width: 100%;
            flex-grow: 1;
            display: flex;
            align-items: center;
          }
          .barcode-container svg {
            max-height: 6mm;
            width: 100%;
            object-fit: contain;
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      
      productsToPrint.forEach(({ product, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          let labelContent = '';
          if (showName) labelContent += `<div class="product-name">${product.name}</div>`;
          
          let barcodeHtml = '';
          try {
            const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            JsBarcode(svgNode, product.sku, {
                format: "CODE128",
                width: 1, 
                height: 20, 
                fontSize: 0,
                margin: 0,
                displayValue: false
            });
            barcodeHtml = `<div class="barcode-container">${svgNode.outerHTML}</div>`;
          } catch (e) {
            console.error(`Failed to generate barcode for SKU ${product.sku}:`, e);
            barcodeHtml = `<div class="barcode-container" style="color: red;">Error</div>`;
          }
          labelContent += barcodeHtml;

          if (showSku) labelContent += `<div class="product-sku">${product.sku}</div>`;
          if (showPrice) labelContent += `<div class="product-price">MMK ${product.sellPrice.toLocaleString()}</div>`;

          printWindow.document.write(`<div class="label">${labelContent}</div>`);
        }
      });

      printWindow.document.write('</body></html>');
      printWindow.document.close();

      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error('Print failed:', e);
          toast({ variant: 'destructive', title: 'Print Failed', description: 'Could not open the print dialog.' });
        } finally {
            if (!printWindow.closed) { printWindow.close(); }
        }
      }, 500); 

    } catch (error) {
      console.error('Failed to generate print page:', error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Generate Barcodes">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="showName" checked={showName} onCheckedChange={(c) => setShowName(!!c)} />
            <Label htmlFor="showName">Name</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showSku" checked={showSku} onCheckedChange={(c) => setShowSku(!!c)} />
            <Label htmlFor="showSku">SKU</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showPrice" checked={showPrice} onCheckedChange={(c) => setShowPrice(!!c)} />
            <Label htmlFor="showPrice">Price</Label>
          </div>
          <Button onClick={handlePrint} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            {isLoading ? 'Generating...' : 'Export to PDF'}
          </Button>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Add Products to Print List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-grow space-y-2">
                        <Label htmlFor="search-sku">Search by SKU</Label>
                        <Input id="search-sku" value={searchSku} onChange={(e) => setSearchSku(e.target.value)} placeholder="Enter SKU..." />
                    </div>
                    <div className="flex-grow space-y-2 min-w-[150px]">
                        <Label>Product Name</Label>
                        <Input value={foundProduct?.name || ''} readOnly />
                    </div>
                    <div className="w-24 space-y-2">
                        <Label htmlFor="quantity-to-add">Quantity</Label>
                        <Input id="quantity-to-add" type="number" value={quantityToAdd} onChange={(e) => setQuantityToAdd(e.target.value)} />
                    </div>
                    <Button onClick={handleAddItem}><PlusCircle className="mr-2 h-4 w-4"/> Add to List</Button>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Print List</CardTitle>
                <CardDescription>Review items and quantities before printing.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-96 overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="w-24">Quantity</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productsToPrint.length > 0 ? productsToPrint.map(({ product, quantity }) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => handleQuantityChange(product.id, Number(e.target.value))}
                                            className="w-20 text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(product.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No products added yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
