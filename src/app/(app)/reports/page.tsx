import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sales, products, stores } from "@/lib/data";
import { FileDown } from "lucide-react";

const getReportData = (period: 'daily' | 'monthly') => {
    const reports: { [key: string]: { date: string, sales: number, cogs: number, profit: number } } = {};
    
    sales.forEach(sale => {
        const d = new Date(sale.date);
        const key = period === 'daily' 
            ? d.toISOString().split('T')[0] 
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        if (!reports[key]) {
            reports[key] = { date: key, sales: 0, cogs: 0, profit: 0 };
        }

        reports[key].sales += sale.total;
        let saleCogs = 0;
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if(product) saleCogs += product.buyPrice * item.quantity;
        });
        reports[key].cogs += saleCogs;
        reports[key].profit = reports[key].sales - reports[key].cogs;
    });

    return Object.values(reports).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const dailyReports = getReportData('daily');
const monthlyReports = getReportData('monthly');

const ReportTable = ({ data, periodLabel }: { data: any[], periodLabel: string }) => (
    <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{periodLabel}</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Profit (Sales - COGS)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((report) => (
                <TableRow key={report.date}>
                    <TableCell className="font-medium">{report.date}</TableCell>
                    <TableCell className="text-right">${report.sales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${report.profit.toFixed(2)}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
);


export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports">
        <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
        </Button>
      </PageHeader>
      <Tabs defaultValue="daily">
        <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
            <ReportTable data={dailyReports} periodLabel="Date" />
        </TabsContent>
        <TabsContent value="monthly">
            <ReportTable data={monthlyReports} periodLabel="Month" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
