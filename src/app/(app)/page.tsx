
'use client';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { SalesChart } from "@/components/app/dashboard/sales-chart";
import { BestSellers } from "@/components/app/dashboard/best-sellers";
import { DollarSign, TrendingUp } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SaleTransaction } from '@/lib/types';
import { InventoryAlerts } from '@/components/app/dashboard/inventory-alerts';

// Helper function to safely convert date
const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export default function DashboardPage() {
  const { sales, products, loading, stores, inventory } = useData();
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const filteredSales = useMemo(() => {
    if (selectedStore === 'all') {
      return sales.filter(s => s.status === 'completed');
    }
    return sales.filter(sale => sale.storeId === selectedStore && sale.status === 'completed');
  }, [sales, selectedStore]);


  const getTodayMetrics = (salesData: SaleTransaction[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    let todaySales = 0;
    let todayCogs = 0;
  
    salesData.forEach(sale => {
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

  const { todaySales, todayProfit } = useMemo(() => getTodayMetrics(filteredSales), [filteredSales, products]);
  const isFiltered = selectedStore !== 'all';

  return (
    <div>
      <PageHeader title="Dashboard">
         <Select onValueChange={setSelectedStore} value={selectedStore}>
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
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard 
          title="Today's Sales"
          value={`MMK ${todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Total sales recorded today."
          loading={loading}
          className="bg-shiny-green rounded-xl shadow-lg"
        />
        <StatCard 
          title="Today's Profit"
          value={`MMK ${todayProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Gross profit (Sales - COGS)."
          loading={loading}
          className="bg-shiny-blue rounded-xl shadow-lg"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <SalesChart sales={filteredSales} isFiltered={isFiltered} className="bg-shiny-orange rounded-xl shadow-drop-shadow-black" />
        <BestSellers sales={filteredSales} products={products} className="bg-shiny-purple rounded-xl shadow-lg" />
      </div>
      <div className="mt-6">
        <InventoryAlerts inventory={inventory} products={products} stores={stores} className="bg-shiny-yellow rounded-xl shadow-lg" />
      </div>
    </div>
  );
}
