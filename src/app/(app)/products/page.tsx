import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/app/products/data-table";
import { productColumns, categoryColumns, supplierColumns, storeColumns } from "@/components/app/products/columns";
import { AddEntitySheet } from "@/components/app/products/add-entity-sheet";
import { AddProductForm, AddCategoryForm, AddSupplierForm, AddStoreForm } from "@/components/app/products/forms";
import { products, categories, suppliers, stores } from "@/lib/data";

export default function ProductsPage() {
  return (
    <div>
      <PageHeader title="Products" />
      <Tabs defaultValue="items">
        <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="stores">Stores</TabsTrigger>
            </TabsList>
            <div className="hidden" data-state="active"> {/*This will be managed by JS to show the correct button */}
                <AddEntitySheet buttonText="Add Item" title="Add a new item" description="Fill in the details for the new product.">
                    <AddProductForm />
                </AddEntitySheet>
                <AddEntitySheet buttonText="Add Category" title="Add a new category" description="Enter the name for the new category.">
                    <AddCategoryForm />
                </AddEntitySheet>
                <AddEntitySheet buttonText="Add Supplier" title="Add a new supplier" description="Enter the details for the new supplier.">
                    <AddSupplierForm />
                </AddEntitySheet>
                <AddEntitySheet buttonText="Add Store" title="Add a new store" description="Enter the details for the new store location.">
                    <AddStoreForm />
                </AddEntitySheet>
            </div>
        </div>

        <TabsContent value="items">
          <div className="flex justify-end mb-4">
             <AddEntitySheet buttonText="Add Item" title="Add a new item" description="Fill in the details for the new product.">
                <AddProductForm />
            </AddEntitySheet>
          </div>
          <DataTable columns={productColumns} data={products} filterColumnId="name" filterPlaceholder="Filter items by name..."/>
        </TabsContent>
        <TabsContent value="categories">
            <div className="flex justify-end mb-4">
                <AddEntitySheet buttonText="Add Category" title="Add a new category" description="Enter the name for the new category.">
                    <AddCategoryForm />
                </AddEntitySheet>
            </div>
          <DataTable columns={categoryColumns} data={categories} filterColumnId="name" filterPlaceholder="Filter categories by name..."/>
        </TabsContent>
        <TabsContent value="suppliers">
            <div className="flex justify-end mb-4">
                <AddEntitySheet buttonText="Add Supplier" title="Add a new supplier" description="Enter the details for the new supplier.">
                    <AddSupplierForm />
                </AddEntitySheet>
            </div>
          <DataTable columns={supplierColumns} data={suppliers} filterColumnId="name" filterPlaceholder="Filter suppliers by name..."/>
        </TabsContent>
        <TabsContent value="stores">
            <div className="flex justify-end mb-4">
                <AddEntitySheet buttonText="Add Store" title="Add a new store" description="Enter the details for the new store location.">
                    <AddStoreForm />
                </AddEntitySheet>
            </div>
          <DataTable columns={storeColumns} data={stores} filterColumnId="name" filterPlaceholder="Filter stores by name..."/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
