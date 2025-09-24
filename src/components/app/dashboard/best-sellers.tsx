
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SaleTransaction, Product } from "@/lib/types";
import type { Timestamp } from 'firebase/firestore';

const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export function BestSellers({ sales, products }: { sales: SaleTransaction[], products: Product[] }) {
  const bestSellingItems = (() => {
    const itemSales: { [key: string]: { name: string, quantity: number, total: number } } = {};

    sales.forEach(sale => {
      if (sale.status === 'voided') return;

      const saleDate = toDate(sale.date);
      const today = new Date();
      const monthDiff = today.getMonth() - saleDate.getMonth() + (12 * (today.getFullYear() - saleDate.getFullYear()));

      if (monthDiff === 0) { // Only for the current month
        sale.items.forEach(item => {
          if (!itemSales[item.productId]) {
            const product = products.find(p => p.id === item.productId);
            itemSales[item.productId] = { name: product?.name || 'Unknown', quantity: 0, total: 0 };
          }
          
          // Calculate the portion of the discount for this item
          const discountRatio = sale.subtotal > 0 ? item.total / sale.subtotal : 0;
          const itemDiscount = sale.discount * discountRatio;
          const salesAfterDiscount = item.total - itemDiscount;

          itemSales[item.productId].quantity += item.quantity;
          itemSales[item.productId].total += salesAfterDiscount;
        });
      }
    });

    return Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Selling Items</CardTitle>
        <CardDescription>Top 5 best selling items this month by quantity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantity Sold</TableHead>
              <TableHead className="text-right">Total Sales (After Discount)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {bestSellingItems.length > 0 ? (
                bestSellingItems.map((item, index) => (
                <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">MMK {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No best sellers this month.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
