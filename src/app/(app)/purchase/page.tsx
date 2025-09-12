import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PurchasePage() {
  return (
    <div>
      <PageHeader title="New Purchase" />
      <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
            <p>The purchase page is under construction. It will be similar to the Sales page but for recording purchases and updating stock.</p>
        </CardContent>
      </Card>
    </div>
  );
}
