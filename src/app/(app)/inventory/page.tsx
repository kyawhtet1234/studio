import { PageHeader } from "@/components/app/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inventory, products, stores, categories } from "@/lib/data";

const inventoryData = inventory.map(item => {
    const product = products.find(p => p.id === item.productId);
    const store = stores.find(s => s.id === item.storeId);
    const category = categories.find(c => c.id === product?.categoryId);
    return {
        ...item,
        productName: product?.name,
        sku: product?.sku,
        categoryName: category?.name,
        storeName: store?.name,
    };
});

export default function InventoryPage() {
  return (
    <div>
      <PageHeader title="Inventory">
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by store" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </PageHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item, index) => (
                <TableRow key={index}>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell>{item.storeName}</TableCell>
                    <TableCell className="text-right">{item.stock}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
