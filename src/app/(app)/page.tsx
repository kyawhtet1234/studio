
'use client';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { SalesChart } from "@/components/app/dashboard/sales-chart";
import { BestSellers } from "@/components/app/dashboard/best-sellers";
import { DollarSign, TrendingUp } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';

// Helper function to safely convert date
const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export default function DashboardPage() {
  const { sales, products, loading } = useData();

  const getTodayMetrics = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    let todaySales = 0;
    let todayCogs = 0;
  
    sales.forEach(sale => {
      if (sale.status === 'voided') return;

      const saleDate = toDate(sale.date);
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

  const { todaySales, todayProfit } = getTodayMetrics();

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Sales"
          value={`MMK ${todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Total sales recorded today."
          loading={loading}
          className="bg-card-1"
        />
        <StatCard 
          title="Today's Profit"
          value={`MMK ${todayProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Gross profit (Sales - COGS)."
          loading={loading}
          className="bg-card-2"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <SalesChart sales={sales} className="bg-card-3" />
        <BestSellers sales={sales} products={products} className="bg-card-4" />
      </div>
    </div>
  );
}
