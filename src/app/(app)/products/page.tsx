
'use client';
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/app/products/data-table";
import { productColumns, categoryColumns, supplierColumns, storeColumns } from "@/components/app/products/columns";
import { AddEntitySheet } from "@/components/app/products/add-entity-sheet";
import { EditEntitySheet } from "@/components/app/products/edit-entity-sheet";
import { AddProductForm, AddCategoryForm, AddSupplierForm, AddStoreForm } from "@/components/app/products/forms";
import { useState } from "react";
import { useData } from "@/lib/data-context";
import type { Product, Category, Supplier, Store } from "@/lib/types";

type EditingState = 
  | { type: 'product', data: Product }
  | { type: 'category', data: Category }
  | { type: 'supplier', data: Supplier }
  | { type: 'store', data: Store }
  | null;

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [editingEntity, setEditingEntity] = useState<EditingState>(null);
  
  const { 
    products, addProduct, updateProduct, deleteProduct,
    categories, addCategory, updateCategory, deleteCategory,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    stores, addStore, updateStore, deleteStore
  } = useData();

  const renderAddButton = () => {
    switch (activeTab) {
      case "items":
        return (
          <AddEntitySheet buttonText="Add Item" title="Add a new item" description="Fill in the details for the new product.">
            {(onSuccess) => <AddProductForm onSave={addProduct} categories={categories} suppliers={suppliers} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      case "categories":
        return (
          <AddEntitySheet buttonText="Add Category" title="Add a new category" description="Enter the name for the new category.">
             {(onSuccess) => <AddCategoryForm onSave={addCategory} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      case "suppliers":
        return (
          <AddEntitySheet buttonText="Add Supplier" title="Add a new supplier" description="Enter the details for the new supplier.">
            {(onSuccess) => <AddSupplierForm onSave={addSupplier} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      case "stores":
        return (
          <AddEntitySheet buttonText="Add Store" title="Add a new store" description="Enter the details for the new store location.">
            {(onSuccess) => <AddStoreForm onSave={addStore} onSuccess={onSuccess} />}
          </AddEntitySheet>
        );
      default:
        return null;
    }
  };

  const renderEditSheet = () => {
    if (!editingEntity) return null;

    switch (editingEntity.type) {
      case "product":
        return (
          <EditEntitySheet
            title="Edit Item"
            description="Update the details for this product."
            isOpen={!!editingEntity}
            onClose={() => setEditingEntity(null)}
          >
            {(onSuccess) => <AddProductForm 
              onSave={(data) => updateProduct(editingEntity.data.id, data)} 
              categories={categories} 
              suppliers={suppliers} 
              onSuccess={onSuccess} 
              product={editingEntity.data}
            />}
          </EditEntitySheet>
        );
      case "category":
        return (
          <EditEntitySheet
            title="Edit Category"
            description="Update the name for this category."
            isOpen={!!editingEntity}
            onClose={() => setEditingEntity(null)}
          >
             {(onSuccess) => <AddCategoryForm 
                onSave={(data) => updateCategory(editingEntity.data.id, data)}
                onSuccess={onSuccess} 
                category={editingEntity.data}
              />}
          </EditEntitySheet>
        );
      case "supplier":
        return (
          <EditEntitySheet
            title="Edit Supplier"
            description="Update the details for this supplier."
            isOpen={!!editingEntity}
            onClose={() => setEditingEntity(null)}
          >
            {(onSuccess) => <AddSupplierForm
              onSave={(data) => updateSupplier(editingEntity.data.id, data)}
              onSuccess={onSuccess}
              supplier={editingEntity.data}
            />}
          </EditEntitySheet>
        );
      case "stores":
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
      default:
        return null;
    }
  };

  const productCols = productColumns({ onEdit: (data) => setEditingEntity({ type: 'product', data }), onDelete: deleteProduct });
  const categoryCols = categoryColumns({ onEdit: (data) => setEditingEntity({ type: 'category', data }), onDelete: deleteCategory });
  const supplierCols = supplierColumns({ onEdit: (data) => setEditingEntity({ type: 'supplier', data }), onDelete: deleteSupplier });
  const storeCols = storeColumns({ onEdit: (data) => setEditingEntity({ type: 'store', data }), onDelete: deleteStore });

  return (
    <div>
      <PageHeader title="Products" />
      <Tabs defaultValue="items" onValueChange={setActiveTab} value={activeTab}>
        <div className="flex justify-between items-center mb-4">
            <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="stores">Stores</TabsTrigger>
            </TabsList>
            <div>
              {renderAddButton()}
            </div>
        </div>

        <TabsContent value="items">
          <DataTable columns={productCols} data={products} filterColumnId="name" filterPlaceholder="Filter items by name..."/>
        </TabsContent>
        <TabsContent value="categories">
          <DataTable columns={categoryCols} data={categories} filterColumnId="name" filterPlaceholder="Filter categories by name..."/>
        </TabsContent>
        <TabsContent value="suppliers">
          <DataTable columns={supplierCols} data={suppliers} filterColumnId="name" filterPlaceholder="Filter suppliers by name..."/>
        </TabsContent>
        <TabsContent value="stores">
          <DataTable columns={storeCols} data={stores} filterColumnId="name" filterPlaceholder="Filter stores by name..."/>
        </TabsContent>
      </Tabs>
      {renderEditSheet()}
    </div>
  );
}
