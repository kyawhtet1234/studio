
'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/app/products/data-table";
import { expenseColumns, expenseCategoryColumns } from "@/components/app/finance/columns";
import { AddEntitySheet } from "@/components/app/products/add-entity-sheet";
import { EditEntitySheet } from "@/components/app/products/edit-entity-sheet";
import { AddExpenseForm, AddExpenseCategoryForm } from "@/components/app/finance/forms";
import type { Expense, ExpenseCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


// Helper function to safely convert date
const toDate = (date: Date | Timestamp): Date => {
  if (date instanceof Date) {
    return date;
  }
  return (date as Timestamp).toDate();
};

export default function FinancePage() {
  const { 
    sales, 
    products, 
    expenses, 
    addExpense, 
    deleteExpense, 
    expenseCategories,
    addExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    loading 
  } = useData();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

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

  const { monthSales, monthExpenses, netProfit } = getFinancialMetrics();
  const expenseCols = expenseColumns({ onDelete: deleteExpense, categories: expenseCategories });
  const categoryCols = expenseCategoryColumns({ 
    onEdit: (data) => setEditingCategory(data), 
    onDelete: deleteExpenseCategory 
  });

  const renderAddButton = () => {
     switch (activeTab) {
      case 'expenses':
        return (
          <AddEntitySheet buttonText="Add Expense" title="Add a new expense" description="Enter the details for the new expense.">
            {(onSuccess) => <AddExpenseForm onSave={addExpense} onSuccess={onSuccess} categories={expenseCategories} />}
          </AddEntitySheet>
        );
      case 'expenseCategories':
         return (
          <AddEntitySheet buttonText="Add Category" title="Add a new expense category" description="Enter a name for the new category.">
            {(onSuccess) => <AddExpenseCategoryForm onSave={addExpenseCategory} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      default:
        return null;
    }
  }


  return (
    <div>
      <PageHeader title="Finance" />

      <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="netProfit">Net Profit</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="expenseCategories">Expense Categories</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
                <TabsTrigger value="allocations">Cash Allocations</TabsTrigger>
            </TabsList>
             {['expenses', 'expenseCategories'].includes(activeTab) && (
                <div>
                  {renderAddButton()}
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
         <TabsContent value="netProfit">
            <Card>
                <CardHeader>
                    <CardTitle>Net Profit Report</CardTitle>
                    <CardDescription>Detailed profit and loss analysis. Coming soon!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This section will contain detailed reports for monthly and yearly profit and loss.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="expenses">
            <DataTable columns={expenseCols} data={expenses} filterColumnId="description" filterPlaceholder="Filter expenses by description..."/>
        </TabsContent>
        <TabsContent value="expenseCategories">
            <DataTable columns={categoryCols} data={expenseCategories} filterColumnId="name" filterPlaceholder="Filter categories by name..."/>
        </TabsContent>
        <TabsContent value="forecast">
             <Card>
                <CardHeader>
                    <CardTitle>Financial Forecast</CardTitle>
                    <CardDescription>Projections based on historical data. Coming soon!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This section will display financial forecasts to help with planning.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="allocations">
             <Card>
                <CardHeader>
                    <CardTitle>Cash Allocations</CardTitle>
                    <CardDescription>Manage funds for new projects or hiring. Coming soon!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This section will provide tools to allocate your cash effectively.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      <EditEntitySheet
        title="Edit Expense Category"
        description="Update the name for this category."
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
      >
        {(onSuccess) => <AddExpenseCategoryForm 
            onSave={(data) => updateExpenseCategory(editingCategory!.id, data)}
            onSuccess={onSuccess} 
            category={editingCategory!}
            />}
      </EditEntitySheet>
    </div>
  );
}
