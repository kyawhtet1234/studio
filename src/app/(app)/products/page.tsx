
'use client';
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/app/products/data-table";
import { productColumns, categoryColumns, supplierColumns, storeColumns } from "@/components/app/products/columns";
import { AddEntitySheet } from "@/components/app/products/add-entity-sheet";
import { AddProductForm, AddCategoryForm, AddSupplierForm, AddStoreForm } from "@/components/app/products/forms";
import { products as initialProducts, categories as initialCategories, suppliers as initialSuppliers, stores as initialStores } from "@/lib/data";
import { useState } from "react";
import type { Product, Category, Supplier, Store } from "@/lib/types";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [stores, setStores] = useState<Store[]>(initialStores);

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...newProduct, id: `prod-${Date.now()}` }]);
  };

  const handleAddCategory = (newCategory: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...newCategory, id: `cat-${Date.now()}` }]);
  };

  const handleAddSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
    setSuppliers(prev => [...prev, { ...newSupplier, id: `sup-${Date.now()}` }]);
  };

  const handleAddStore = (newStore: Omit<Store, 'id'>) => {
    setStores(prev => [...prev, { ...newStore, id: `store-${Date.now()}` }]);
  };


  const renderAddButton = () => {
    switch (activeTab) {
      case "items":
        return (
          <AddEntitySheet buttonText="Add Item" title="Add a new item" description="Fill in the details for the new product.">
            <AddProductForm onAddProduct={handleAddProduct} categories={categories} suppliers={suppliers} />
          </AddEntitySheet>
        );
      case "categories":
        return (
          <AddEntitySheet buttonText="Add Category" title="Add a new category" description="Enter the name for the new category.">
            <AddCategoryForm onAddCategory={handleAddCategory} />
          </AddEntitySheet>
        );
      case "suppliers":
        return (
          <AddEntitySheet buttonText="Add Supplier" title="Add a new supplier" description="Enter the details for the new supplier.">
            <AddSupplierForm onAddSupplier={handleAddSupplier} />
          </AddEntitySheet>
        );
      case "stores":
        return (
          <AddEntitySheet buttonText="Add Store" title="Add a new store" description="Enter the details for the new store location.">
            <AddStoreForm onAddStore={handleAddStore} />
          </AddEntitySheet>
        );
      default:
        return null;
    }
  };

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
          <DataTable columns={productColumns} data={products} filterColumnId="name" filterPlaceholder="Filter items by name..."/>
        </TabsContent>
        <TabsContent value="categories">
          <DataTable columns={categoryColumns} data={categories} filterColumnId="name" filterPlaceholder="Filter categories by name..."/>
        </TabsContent>
        <TabsContent value="suppliers">
          <DataTable columns={supplierColumns} data={suppliers} filterColumnId="name" filterPlaceholder="Filter suppliers by name..."/>
        </TabsContent>
        <TabsContent value="stores">
          <DataTable columns={storeColumns} data={stores} filterColumnId="name" filterPlaceholder="Filter stores by name..."/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
