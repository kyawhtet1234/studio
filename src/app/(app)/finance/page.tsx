
'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/dashboard/stat-card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import type { Timestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/app/products/data-table";
import { expenseColumns, cashAllocationColumns, liabilityColumns } from "@/components/app/finance/columns";
import { AddEntitySheet } from "@/components/app/products/add-entity-sheet";
import { EditEntitySheet } from "@/components/app/products/edit-entity-sheet";
import { AddExpenseForm, AddLiabilityForm } from "@/components/app/finance/forms";
import type { Expense, CashAllocation, Liability, SaleTransaction } from '@/lib/types';
import { CashFlowReport } from '@/components/app/finance/cash-flow-report';
import { ExpenseBreakdownChart } from '@/components/app/finance/expense-breakdown-chart';
import { BalanceSheet } from '@/components/app/finance/balance-sheet';
import { NetProfitReport } from '@/components/app/finance/net-profit-report';


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
    purchases,
    inventory,
    addExpense, 
    deleteExpense, 
    expenseCategories,
    cashAccounts,
    liabilities,
    addLiability,
    updateLiability,
    deleteLiability,
    stores,
    loading 
  } = useData();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  const getFinancialMetrics = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let monthSales = 0;
    let monthCogs = 0;
    let monthExpenses = 0;

    sales.forEach(sale => {
      if (sale.status === 'voided' || sale.status === 'quotation') return;
      const saleDate = toDate(sale.date);
      if (saleDate >= startOfMonth) {
        monthSales += sale.total;
        sale.items.forEach(item => {
           if (item.cogs) {
            monthCogs += item.cogs;
          } else {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              monthCogs += product.buyPrice * item.quantity;
            }
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
  const expenseCols = expenseColumns({ onDelete: deleteExpense, categories: expenseCategories, stores });
  const liabilityCols = liabilityColumns({
    onEdit: (data) => setEditingLiability(data),
    onDelete: deleteLiability,
  });
  
  const allSaleItems = sales.flatMap(s => s.items.map(i => ({...i, date: s.date})));
  
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  }, [expenses]);


  const renderAddButton = () => {
     switch (activeTab) {
      case 'expenses':
        return (
          <AddEntitySheet buttonText="Add Expense" title="Add a new expense" description="Enter the details for the new expense.">
            {(onSuccess) => <AddExpenseForm onSave={addExpense} onSuccess={onSuccess} categories={expenseCategories} stores={stores} />}
          </AddEntitySheet>
        );
      case 'liabilities':
        return (
          <AddEntitySheet buttonText="Add Liability" title="Add a new liability" description="Enter the details for a new liability, such as a loan or debt.">
            {(onSuccess) => <AddLiabilityForm onSave={addLiability} onSuccess={onSuccess} />}
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <TabsList className="overflow-x-auto self-start h-auto flex-nowrap w-full no-scrollbar">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="balanceSheet">Balance Sheet</TabsTrigger>
                <TabsTrigger value="cashFlow">Cash Flow</TabsTrigger>
                <TabsTrigger value="netProfit">Net Profit</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
            </TabsList>
             {['expenses', 'liabilities'].includes(activeTab) && (
                <div>
                  {renderAddButton()}
                </div>
            )}
        </div>

        <TabsContent value="overview">
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard 
                    title="This Month's Sales"
                    value={`MMK ${monthSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    description="Total sales recorded this month."
                    loading={loading}
                    className="bg-shiny-red rounded-xl shadow-lg"
                    />
                    <StatCard 
                    title="This Month's Net Profit"
                    value={`MMK ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={TrendingUp}
                    description="Net Profit (Sales - COGS - Expenses)."
                    loading={loading}
                     className="bg-shiny-blue rounded-xl shadow-lg"
                    />
                    <StatCard 
                    title="This Month's Expenses"
                    value={`MMK ${monthExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={TrendingDown}
                    description="Total expenses recorded this month."
                    loading={loading}
                     className="bg-shiny-green rounded-xl shadow-lg"
                    />
                </div>
                <div className="overflow-x-auto">
                  <ExpenseBreakdownChart expenses={expenses} expenseCategories={expenseCategories} />
                </div>
             </div>
        </TabsContent>
        <TabsContent value="balanceSheet">
            <BalanceSheet 
                cashAccounts={cashAccounts} 
                inventory={inventory} 
                products={products} 
                liabilities={liabilities}
            />
        </TabsContent>
        <TabsContent value="cashFlow">
           <CashFlowReport sales={sales} purchases={purchases} expenses={expenses} />
        </TabsContent>
         <TabsContent value="netProfit">
            <NetProfitReport sales={sales} products={products} expenses={expenses} />
        </TabsContent>
        <TabsContent value="expenses">
            <DataTable columns={expenseCols} data={sortedExpenses} filterColumnId="description" filterPlaceholder="Filter expenses by description..."/>
        </TabsContent>
        <TabsContent value="liabilities">
            <DataTable columns={liabilityCols} data={liabilities} filterColumnId="name" filterPlaceholder="Filter liabilities by name..."/>
        </TabsContent>
      </Tabs>
      <EditEntitySheet
        title="Edit Liability"
        description="Update the details for this liability."
        isOpen={!!editingLiability}
        onClose={() => setEditingLiability(null)}
      >
        {(onSuccess) => <AddLiabilityForm
            onSave={(data) => updateLiability(editingLiability!.id, data)}
            onSuccess={onSuccess}
            liability={editingLiability!}
            />}
      </EditEntitySheet>
    </div>
  );
}
