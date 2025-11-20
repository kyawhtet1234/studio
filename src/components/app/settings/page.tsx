

'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { useData } from '@/lib/data-context';
import type { Store, PaymentType, ExpenseCategory } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/components/app/products/data-table';
import { storeColumns, paymentTypeColumns, expenseCategoryColumns } from '@/components/app/products/columns';
import { AddEntitySheet } from '@/components/app/products/add-entity-sheet';
import { EditEntitySheet } from '@/components/app/products/edit-entity-sheet';
import { AddStoreForm, AddPaymentTypeForm } from '@/components/app/products/forms';
import { AddExpenseCategoryForm } from '@/components/app/finance/forms';
import { ReceiptSettings } from '@/components/app/settings/receipt-settings';
import { InvoiceSettings } from '@/components/app/settings/invoice-settings';
import { QuotationSettings } from '@/components/app/settings/quotation-settings';
import { ThemeSettings } from '@/components/app/settings/theme-settings';
import { BusinessGoalsSettings } from '@/components/app/settings/business-goals-settings';
import { BrandingSettings } from '@/components/app/settings/branding-settings';
import { UserManagement } from '@/components/app/settings/user-management';

type EditingState = 
  | { type: 'store', data: Store }
  | { type: 'paymentType', data: PaymentType }
  | { type: 'expenseCategory', data: ExpenseCategory }
  | null;


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("branding");
  const [editingEntity, setEditingEntity] = useState<EditingState>(null);

  const {
    stores, addStore, updateStore, deleteStore,
    paymentTypes, addPaymentType, updatePaymentType, deletePaymentType,
    expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory
  } = useData();

  const storeCols = storeColumns({ onEdit: (data) => setEditingEntity({ type: 'store', data }), onDelete: deleteStore });
  const paymentTypeCols = paymentTypeColumns({ onEdit: (data) => setEditingEntity({ type: 'paymentType', data }), onDelete: deletePaymentType });
  const expenseCategoryCols = expenseCategoryColumns({ onEdit: (data) => setEditingEntity({ type: 'expenseCategory', data }), onDelete: deleteExpenseCategory });

  const renderAddButton = () => {
    switch (activeTab) {
      case "stores":
        return (
          <AddEntitySheet buttonText="Add Store" title="Add a new store" description="Enter the details for the new store location.">
            {(onSuccess) => <AddStoreForm onSave={addStore} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      case "paymentTypes":
        return (
          <AddEntitySheet buttonText="Add Payment Type" title="Add a new payment type" description="Enter the name for the new payment type.">
              {(onSuccess) => <AddPaymentTypeForm onSave={addPaymentType} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      case "expenseCategories":
         return (
          <AddEntitySheet buttonText="Add Category" title="Add a new expense category" description="Enter a name for the new category.">
            {(onSuccess) => <AddExpenseCategoryForm onSave={addExpenseCategory} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      default:
        return null;
    }
  };

  const renderEditSheet = () => {
    if (!editingEntity) return null;

    switch (editingEntity.type) {
      case "store":
        return (
          <EditEntitySheet
            title="Edit Store"
            description="Update the details for this store location."
            isOpen={!!editingEntity}
            onClose={() => setEditingEntity(null)}
          >
            {(onSuccess) => <AddStoreForm
              onSave={(data) => updateStore(editingEntity.data.id, data)}
              onSuccess={onSuccess}
              store={editingEntity.data}
            />}
          </EditEntitySheet>
        );
      case "paymentType":
        return (
          <EditEntitySheet
            title="Edit Payment Type"
            description="Update the name for this payment type."
            isOpen={!!editingEntity}
            onClose={() => setEditingEntity(null)}
          >
            {(onSuccess) => <AddPaymentTypeForm
              onSave={(data) => updatePaymentType(editingEntity.data.id, data)}
              onSuccess={onSuccess}
              paymentType={editingEntity.data}
            />}
          </EditEntitySheet>
        );
      case "expenseCategory":
        return (
          <EditEntitySheet
            title="Edit Expense Category"
            description="Update the name for this category."
            isOpen={!!editingEntity}
            onClose={() => setEditingEntity(null)}
          >
            {(onSuccess) => <AddExpenseCategoryForm 
                onSave={(data) => updateExpenseCategory(editingEntity.data.id, data)}
                onSuccess={onSuccess} 
                category={editingEntity.data}
                />}
          </EditEntitySheet>
        );
      default:
        return null;
    }
  };
  
  return (
    <div>
      <PageHeader title="Settings" />
        <Tabs defaultValue="branding" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <TabsList className="overflow-x-auto self-start h-auto flex-nowrap w-full no-scrollbar">
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="receipt">Receipt</TabsTrigger>
                    <TabsTrigger value="invoice">Invoice</TabsTrigger>
                    <TabsTrigger value="quotation">Quotation</TabsTrigger>
                    <TabsTrigger value="stores">Stores</TabsTrigger>
                    <TabsTrigger value="paymentTypes">Payment Types</TabsTrigger>
                    <TabsTrigger value="expenseCategories">Expense Categories</TabsTrigger>
                </TabsList>
                 <div className="self-start md:self-center">
                    {renderAddButton()}
                 </div>
            </div>
            <TabsContent value="branding" className="mt-4">
                <BrandingSettings />
            </TabsContent>
            <TabsContent value="theme" className="mt-4">
                <ThemeSettings />
            </TabsContent>
             <TabsContent value="users" className="mt-4">
                <UserManagement />
            </TabsContent>
            <TabsContent value="goals" className="mt-4">
                <BusinessGoalsSettings />
            </TabsContent>
            <TabsContent value="receipt" className="mt-4">
                <ReceiptSettings />
            </TabsContent>
            <TabsContent value="invoice" className="mt-4">
                <InvoiceSettings />
            </TabsContent>
            <TabsContent value="quotation" className="mt-4">
                <QuotationSettings />
            </TabsContent>
            <TabsContent value="stores" className="mt-4">
                <DataTable columns={storeCols} data={stores} filterColumnId="name" filterPlaceholder="Filter stores by name..."/>
            </TabsContent>
            <TabsContent value="paymentTypes" className="mt-4">
                <DataTable columns={paymentTypeCols} data={paymentTypes} filterColumnId="name" filterPlaceholder="Filter payment types by name..."/>
            </TabsContent>
            <TabsContent value="expenseCategories" className="mt-4">
                <DataTable columns={expenseCategoryCols} data={expenseCategories} filterColumnId="name" filterPlaceholder="Filter categories by name..."/>
            </TabsContent>
        </Tabs>
        {renderEditSheet()}
    </div>
  );
}

    
