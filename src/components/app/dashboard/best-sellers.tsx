
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SaleTransaction, Product } from "@/lib/types";

export function BestSellers({ sales, products }: { sales: SaleTransaction[], products: Product[] }) {
  const bestSellingItems = (() => {
    const itemSales: { [key: string]: { name: string, quantity: number, total: number } } = {};

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const today = new Date();
      const monthDiff = today.getMonth() - saleDate.getMonth() + (12 * (today.getFullYear() - saleDate.getFullYear()));

      if (monthDiff === 0) {
        sale.items.forEach(item => {
          if (!itemSales[item.productId]) {
            const product = products.find(p => p.id === item.productId);
            itemSales[item.productId] = { name: product?.name || 'Unknown', quantity: 0, total: 0 };
          }
          itemSales[item.productId].quantity += item.quantity;
          itemSales[item.productId].total += item.total;
        });
      }
    });

    return Object.values(itemSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Selling Items</CardTitle>
        <CardDescription>Top 5 best selling items this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bestSellingItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">MMK {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
