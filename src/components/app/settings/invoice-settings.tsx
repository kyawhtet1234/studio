

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/lib/data-context';
import type { DocumentSettings } from '@/lib/types';


export function InvoiceSettings() {
  const { toast } = useToast();
  const { settings, updateInvoiceSettings } = useData();

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [terms, setTerms] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');

  useEffect(() => {
    if (settings.invoice) {
        setCompanyName(settings.invoice.companyName || '');
        setCompanyAddress(settings.invoice.companyAddress || '');
        setCompanyPhone(settings.invoice.companyPhone || '');
        setCompanyLogo(settings.invoice.companyLogo || null);
        setTerms(settings.invoice.terms || '');
        setPaymentInfo(settingsinvoice.paymentInfo || '');
    }
  }, [settings.invoice]);

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
    const newSettings: DocumentSettings = {
      companyName,
      companyAddress,
      companyPhone,
      companyLogo,
      terms,
      paymentInfo
    };
    await updateInvoiceSettings(newSettings);
    toast({
      title: 'Settings Saved',
      description: 'Your invoice details have been updated.',
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
        <CardTitle>Invoice Customization</CardTitle>
        <CardDescription>Set up your company details for invoices and quotations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company LLC" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="company-phone">Company Phone</Label>
            <Input id="company-phone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+1 (123) 456-7890" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-address">Company Address</Label>
          <Textarea id="company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="123 Main St, Anytown, USA 12345" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-info">Payment Information</Label>
          <Textarea id="payment-info" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} placeholder="Bank Name: Example Bank&#10;Account #: 123456789" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms">Terms & Conditions</Label>
          <Textarea id="terms" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment due within 30 days." />
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
