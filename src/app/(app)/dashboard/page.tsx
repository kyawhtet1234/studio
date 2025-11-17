
'use client';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { SalesChart } from "@/components/app/dashboard/sales-chart";
import { BestSellers } from "@/components/app/dashboard/best-sellers";
import { DollarSign, TrendingUp, ReceiptText, BarChartBig } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SaleTransaction } from '@/lib/types';
import { InventoryAlerts } from '@/components/app/dashboard/inventory-alerts';
import { endOfYesterday, startOfYesterday, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { ProfitByCategoryChart } from '@/components/app/dashboard/profit-by-category-chart';
import { NetProfitChart } from '@/components/app/dashboard/net-profit-chart';

// Helper function to safely convert date
const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export default function DashboardPage() {
  const { sales, products, loading, stores, inventory, categories, expenses } = useData();
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const filteredSales = useMemo(() => {
    if (selectedStore === 'all') {
      return sales.filter(s => s.status === 'completed');
    }
    return sales.filter(sale => sale.storeId === selectedStore && sale.status === 'completed');
  }, [sales, selectedStore]);
  
  const filteredExpenses = useMemo(() => {
    if (selectedStore === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.storeId === selectedStore);
  }, [expenses, selectedStore]);


  const { 
    todaySales, 
    todayProfit, 
    todayTransactions, 
    avgTransactionValue,
    salesChange,
    profitChange,
    transactionsChange,
    monthlySalesChange,
    monthlyProfitChange,
    monthlyTransactionsChange,
    monthNetProfit,
    monthNetProfitPercentage
   } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const yesterdayStart = startOfYesterday();
    const yesterdayEnd = endOfYesterday();
    
    const currentMonthStart = startOfMonth(new Date());
    const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
    const prevMonthEnd = endOfMonth(subMonths(new Date(), 1));

    let todaySales = 0, todayCogs = 0, todayTransactions = 0;
    let yesterdaySales = 0, yesterdayCogs = 0, yesterdayTransactions = 0;
    let thisMonthSales = 0, thisMonthCogs = 0, thisMonthTransactions = 0;
    let prevMonthSales = 0, prevMonthCogs = 0, prevMonthTransactions = 0;
  
    filteredSales.forEach(sale => {
      const saleDate = toDate(sale.date);
      let saleCogs = 0;
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          saleCogs += item.cogs ?? (product.buyPrice * item.quantity);
        }
      });

      // Today's Metrics
      if (saleDate >= todayStart && saleDate <= todayEnd) {
        todaySales += sale.total;
        todayCogs += saleCogs;
        todayTransactions++;
      }
      // Yesterday's Metrics
      if (saleDate >= yesterdayStart && saleDate <= yesterdayEnd) {
        yesterdaySales += sale.total;
        yesterdayCogs += saleCogs;
        yesterdayTransactions++;
      }
      // This Month's Metrics
       if (saleDate >= currentMonthStart && saleDate <= todayEnd) {
        thisMonthSales += sale.total;
        thisMonthCogs += saleCogs;
        thisMonthTransactions++;
      }
      // Previous Month's Metrics
      if (saleDate >= prevMonthStart && saleDate <= prevMonthEnd) {
        prevMonthSales += sale.total;
        prevMonthCogs += saleCogs;
        prevMonthTransactions++;
      }
    });

    const thisMonthExpenses = filteredExpenses.reduce((acc, expense) => {
        const expenseDate = toDate(expense.date);
        if (expenseDate >= currentMonthStart && expenseDate <= todayEnd) {
            return acc + expense.amount;
        }
        return acc;
    }, 0);
  
    const todayProfit = todaySales - todayCogs;
    const yesterdayProfit = yesterdaySales - yesterdayCogs;
    const thisMonthGrossProfit = thisMonthSales - thisMonthCogs;
    const prevMonthProfit = prevMonthSales - prevMonthCogs;
    
    const monthNetProfit = thisMonthGrossProfit - thisMonthExpenses;
    const monthNetProfitPercentage = thisMonthSales > 0 ? (monthNetProfit / thisMonthSales) * 100 : 0;


    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    
    return {
        todaySales,
        todayProfit,
        todayTransactions,
        avgTransactionValue: todayTransactions > 0 ? todaySales / todayTransactions : 0,
        salesChange: calcChange(todaySales, yesterdaySales),
        profitChange: calcChange(todayProfit, yesterdayProfit),
        transactionsChange: calcChange(todayTransactions, yesterdayTransactions),
        monthlySalesChange: calcChange(thisMonthSales, prevMonthSales),
        monthlyProfitChange: calcChange(thisMonthGrossProfit, prevMonthProfit),
        monthlyTransactionsChange: calcChange(thisMonthTransactions, prevMonthTransactions),
        monthNetProfit,
        monthNetProfitPercentage,
    };

  }, [filteredSales, products, filteredExpenses]);

  const isFiltered = selectedStore !== 'all';

  return (
    <div>
      <PageHeader title="Dashboard">
         <Select onValueChange={setSelectedStore} value={selectedStore}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Sales"
          value={`MMK ${todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          dailyChange={{ value: salesChange, label: 'vs yesterday' }}
          monthlyChange={{ value: monthlySalesChange, label: 'vs last month' }}
          loading={loading}
          className="bg-shiny-green rounded-xl shadow-lg"
        />
        <StatCard 
          title="Today's Gross Profit"
          value={`MMK ${todayProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          dailyChange={{ value: profitChange, label: 'vs yesterday' }}
          monthlyChange={{ value: monthlyProfitChange, label: 'vs last month' }}
          loading={loading}
          className="bg-shiny-blue rounded-xl shadow-lg"
        />
         <StatCard 
          title="Today's Transactions"
          value={todayTransactions.toLocaleString()}
          icon={ReceiptText}
          dailyChange={{ value: transactionsChange, label: 'vs yesterday' }}
          monthlyChange={{ value: monthlyTransactionsChange, label: 'vs last month' }}
          loading={loading}
          className="bg-shiny-teal rounded-xl shadow-lg"
        />
        <StatCard 
          title="Average Transaction"
          value={`MMK ${avgTransactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={BarChartBig}
          description="Average value per transaction today."
          loading={loading}
          className="bg-shiny-rose-gold rounded-xl shadow-lg"
        />
      </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <SalesChart sales={filteredSales} isFiltered={isFiltered} className="bg-shiny-orange rounded-xl shadow-drop-shadow-black" />
        <NetProfitChart sales={filteredSales} products={products} expenses={filteredExpenses} className="bg-shiny-purple rounded-xl shadow-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <BestSellers sales={filteredSales} products={products} className="bg-shiny-purple rounded-xl shadow-lg" />
        <ProfitByCategoryChart sales={filteredSales} products={products} categories={categories} className="bg-shiny-blue rounded-xl shadow-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 mt-6">
        <InventoryAlerts inventory={inventory} products={products} stores={stores} className="bg-shiny-yellow rounded-xl shadow-lg" />
      </div>
    </div>
  );
}
