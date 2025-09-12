import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { SalesChart } from "@/components/app/dashboard/sales-chart";
import { BestSellers } from "@/components/app/dashboard/best-sellers";
import { DollarSign, TrendingUp, Package } from "lucide-react";
import { sales, products } from "@/lib/data";

function getTodayMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todaySales = 0;
  let todayCogs = 0;

  sales.forEach(sale => {
    const saleDate = new Date(sale.date);
    saleDate.setHours(0, 0, 0, 0);

    if (saleDate.getTime() === today.getTime()) {
      todaySales += sale.total;
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          todayCogs += product.buyPrice * item.quantity;
        }
      });
    }
  });

  const todayProfit = todaySales - todayCogs;
  return { todaySales, todayProfit };
}

export default function DashboardPage() {
  const { todaySales, todayProfit } = getTodayMetrics();

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Sales"
          value={`$${todaySales.toFixed(2)}`}
          icon={DollarSign}
          description="Total sales recorded today."
        />
        <StatCard 
          title="Today's Profit"
          value={`$${todayProfit.toFixed(2)}`}
          icon={TrendingUp}
          description="Gross profit (Sales - COGS)."
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <SalesChart />
        <BestSellers />
      </div>
    </div>
  );
}
