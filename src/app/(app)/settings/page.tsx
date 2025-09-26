
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { Store, PaymentType } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from '@/components/app/products/data-table';
import { storeColumns, paymentTypeColumns } from '@/components/app/products/columns';
import { AddEntitySheet } from '@/components/app/products/add-entity-sheet';
import { EditEntitySheet } from '@/components/app/products/edit-entity-sheet';
import { AddStoreForm, AddPaymentTypeForm } from '@/components/app/products/forms';


const LOGO_STORAGE_KEY = 'receipt-logo';

type EditingState = 
  | { type: 'store', data: Store }
  | { type: 'paymentType', data: PaymentType }
  | null;


function ReceiptSettings() {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useState(() => {
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (savedLogo) {
      setLogo(savedLogo);
      setLogoPreview(savedLogo);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 1MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = () => {
    if (logoPreview) {
      localStorage.setItem(LOGO_STORAGE_KEY, logoPreview);
      setLogo(logoPreview);
      toast({
        title: 'Logo saved',
        description: 'Your new logo will now appear on receipts.',
      });
    }
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    setLogo(null);
    setLogoPreview(null);
    toast({
        title: 'Logo removed',
        description: 'The logo has been removed from receipts.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Customization</CardTitle>
        <CardDescription>Customize the look of your sales receipts by adding a company logo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo preview" width={96} height={96} className="object-contain w-full h-full rounded-md" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="mx-auto h-8 w-8" />
                  <span className="text-xs">Preview</span>
                </div>
              )}
            </div>
            <div className="flex-1">
                <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground mt-2">Upload a PNG, JPG, or GIF file. Max 1MB.</p>
            </div>
              {logo && (
                <Button variant="ghost" size="icon" onClick={handleRemoveLogo}>
                  <X className="h-4 w-4 text-destructive"/>
                  <span className="sr-only">Remove logo</span>
              </Button>
              )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveLogo} disabled={!logoPreview || logo === logoPreview}>Save Logo</Button>
      </CardFooter>
    </Card>
  );
}


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("receipt");
  const [editingEntity, setEditingEntity] = useState<EditingState>(null);

  const {
    stores, addStore, updateStore, deleteStore,
    paymentTypes, addPaymentType, updatePaymentType, deletePaymentType
  } = useData();

  const storeCols = storeColumns({ onEdit: (data) => setEditingEntity({ type: 'store', data }), onDelete: deleteStore });
  const paymentTypeCols = paymentTypeColumns({ onEdit: (data) => setEditingEntity({ type: 'paymentType', data }), onDelete: deletePaymentType });

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
      default:
        return null;
    }
  };
  
  return (
    <div>
      <PageHeader title="Settings" />
        <Tabs defaultValue="receipt" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-between items-center mb-4">
                <TabsList>
                    <TabsTrigger value="receipt">Receipt</TabsTrigger>
                    <TabsTrigger value="stores">Stores</TabsTrigger>
                    <TabsTrigger value="paymentTypes">Payment Types</TabsTrigger>
                </TabsList>
                 {['stores', 'paymentTypes'].includes(activeTab) && (
                  <div>
                    {renderAddButton()}
                  </div>
                )}
            </div>
            <TabsContent value="receipt">
                <ReceiptSettings />
            </TabsContent>
            <TabsContent value="stores">
                <DataTable columns={storeCols} data={stores} filterColumnId="name" filterPlaceholder="Filter stores by name..."/>
            </TabsContent>
            <TabsContent value="paymentTypes">
                <DataTable columns={paymentTypeCols} data={paymentTypes} filterColumnId="name" filterPlaceholder="Filter payment types by name..."/>
            </TabsContent>
        </Tabs>
        {renderEditSheet()}
    </div>
  );
}
