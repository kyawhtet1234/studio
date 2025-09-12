import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stores } from "@/lib/data";

export default function TransferPage() {
  return (
    <div>
      <PageHeader title="Stock Transfer" />
      <Card>
        <CardHeader>
          <CardTitle>Transfer Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>From Store</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select source store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Store</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Items to Transfer</h3>
            <div className="space-y-4">
                 {/* Item rows would be added dynamically here */}
                <div className="flex items-end gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label>Item SKU</Label>
                        <Input placeholder="Enter SKU"/>
                    </div>
                    <div className="w-24 space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" placeholder="Qty"/>
                    </div>
                    <Button variant="outline">Add Item</Button>
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button size="lg">Complete Transfer</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
