
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { ReceiptSettings as ReceiptSettingsType } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';


export function ReceiptSettings() {
  const { toast } = useToast();
  const { settings, updateReceiptSettings } = useData();
  
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [thankYouNote, setThankYouNote] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    if (settings.receipt) {
      setShopName(settings.receipt.shopName || '');
      setShopAddress(settings.receipt.shopAddress || '');
      setThankYouNote(settings.receipt.thankYouNote || '');
      setCompanyLogo(settings.receipt.companyLogo || null);
    }
  }, [settings.receipt]);

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
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const newSettings: ReceiptSettingsType = {
        shopName,
        shopAddress,
        thankYouNote,
        companyLogo
    };
    await updateReceiptSettings(newSettings);
    toast({
      title: 'Settings Saved',
      description: 'Your receipt settings have been updated.',
    });
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    toast({
        title: 'Logo removed',
        description: 'The logo has been removed. Click Save to confirm.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Customization</CardTitle>
        <CardDescription>Customize the look of your sales receipts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="shop-name">Shop Name</Label>
          <Input id="shop-name" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g., The Craft Shop" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop-address">Shop Address</Label>
          <Textarea id="shop-address" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="123 Main St, Anytown" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="thank-you-note">Thank You Note</Label>
          <Input id="thank-you-note" value={thankYouNote} onChange={(e) => setThankYouNote(e.target.value)} placeholder="Thank you for your purchase!" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
              {companyLogo ? (
                <Image src={companyLogo} alt="Logo preview" width={96} height={96} className="object-contain w-full h-full rounded-md" />
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
              {companyLogo && (
                <Button variant="ghost" size="icon" onClick={handleRemoveLogo}>
                  <X className="h-4 w-4 text-destructive"/>
                  <span className="sr-only">Remove logo</span>
              </Button>
              )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
}
