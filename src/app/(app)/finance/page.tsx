
'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { DollarSign, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/app/products/data-table";
import { expenseColumns } from "@/components/app/finance/columns";
import { AddEntitySheet } from "@/components/app/products/add-entity-sheet";
import { AddExpenseForm } from "@/components/app/finance/forms";
import type { Expense } from '@/lib/types';


// Helper function to safely convert date
const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export default function FinancePage() {
  const { sales, products, expenses, addExpense, deleteExpense, loading } = useData();
  const [activeTab, setActiveTab] = useState("overview");

  const getFinancialMetrics = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let monthSales = 0;
    let monthCogs = 0;
    let monthExpenses = 0;

    sales.forEach(sale => {
      if (sale.status === 'voided') return;
      const saleDate = toDate(sale.date);
      if (saleDate >= startOfMonth) {
        monthSales += sale.total;
        sale.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            monthCogs += product.buyPrice * item.quantity;
          }
        });
      }
    });

    expenses.forEach(expense => {
        const expenseDate = toDate(expense.date);
        if(expenseDate >= startOfMonth) {
            monthExpenses += expense.amount;
        }
    });

    const grossProfit = monthSales - monthCogs;
    const netProfit = grossProfit - monthExpenses;
  
    return { monthSales, monthCogs, monthExpenses, grossProfit, netProfit };
  }

  const { monthSales, monthCogs, monthExpenses, grossProfit, netProfit } = getFinancialMetrics();
  const expenseCols = expenseColumns({ onDelete: deleteExpense });


  return (
    <div>
      <PageHeader title="Finance" />

      <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
             {activeTab === 'expenses' && (
                <div>
                  <AddEntitySheet buttonText="Add Expense" title="Add a new expense" description="Enter the details for the new expense.">
                    {(onSuccess) => <AddExpenseForm onSave={addExpense} onSuccess={onSuccess} />}
                  </AddEntitySheet>
                </div>
            )}
        </div>

        <TabsContent value="overview">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                  title="This Month's Sales"
                  value={`MMK ${monthSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={DollarSign}
                  description="Total sales recorded this month."
                  loading={loading}
                />
                <StatCard 
                  title="This Month's Profit"
                  value={`MMK ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={TrendingUp}
                  description="Net Profit (Sales - COGS - Expenses)."
                  loading={loading}
                />
                 <StatCard 
                  title="This Month's Expenses"
                  value={`MMK ${monthExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={TrendingDown}
                  description="Total expenses recorded this month."
                  loading={loading}
                />
            </div>
        </TabsContent>
        <TabsContent value="expenses">
            <DataTable columns={expenseCols} data={expenses} filterColumnId="category" filterPlaceholder="Filter expenses by category..."/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

