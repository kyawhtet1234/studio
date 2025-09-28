
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

const QUOTATION_COMPANY_NAME_KEY = 'quotation-company-name';
const QUOTATION_COMPANY_ADDRESS_KEY = 'quotation-company-address';
const QUOTATION_COMPANY_PHONE_KEY = 'quotation-company-phone';
const QUOTATION_COMPANY_LOGO_KEY = 'quotation-company-logo';
const QUOTATION_TERMS_KEY = 'quotation-terms';
const QUOTATION_PAYMENT_INFO_KEY = 'quotation-payment-info';

export function QuotationSettings() {
  const { toast } = useToast();
  
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [terms, setTerms] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');

  useEffect(() => {
    setCompanyName(localStorage.getItem(QUOTATION_COMPANY_NAME_KEY) || '');
    setCompanyAddress(localStorage.getItem(QUOTATION_COMPANY_ADDRESS_KEY) || '');
    setCompanyPhone(localStorage.getItem(QUOTATION_COMPANY_PHONE_KEY) || '');
    setTerms(localStorage.getItem(QUOTATION_TERMS_KEY) || '');
    setPaymentInfo(localStorage.getItem(QUOTATION_PAYMENT_INFO_KEY) || '');
    
    const savedLogo = localStorage.getItem(QUOTATION_COMPANY_LOGO_KEY);
    if (savedLogo) {
      setCompanyLogo(savedLogo);
      setLogoPreview(savedLogo);
    }
  }, []);

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

  const handleSave = () => {
    localStorage.setItem(QUOTATION_COMPANY_NAME_KEY, companyName);
    localStorage.setItem(QUOTATION_COMPANY_ADDRESS_KEY, companyAddress);
    localStorage.setItem(QUOTATION_COMPANY_PHONE_KEY, companyPhone);
    localStorage.setItem(QUOTATION_TERMS_KEY, terms);
    localStorage.setItem(QUOTATION_PAYMENT_INFO_KEY, paymentInfo);

    if (logoPreview) {
      localStorage.setItem(QUOTATION_COMPANY_LOGO_KEY, logoPreview);
      setCompanyLogo(logoPreview);
    }
    toast({
      title: 'Settings Saved',
      description: 'Your quotation details have been updated.',
    });
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem(QUOTATION_COMPANY_LOGO_KEY);
    setCompanyLogo(null);
    setLogoPreview(null);
    toast({
        title: 'Logo removed',
        description: 'The logo has been removed from quotations.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation Customization</CardTitle>
        <CardDescription>Set up your company details for quotations. If left blank, it will default to invoice settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="quotation-company-name">Company Name</Label>
            <Input id="quotation-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company LLC" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="quotation-company-phone">Company Phone</Label>
            <Input id="quotation-company-phone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+1 (123) 456-7890" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotation-company-address">Company Address</Label>
          <Textarea id="quotation-company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="123 Main St, Anytown, USA 12345" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotation-payment-info">Payment Information</Label>
          <Textarea id="quotation-payment-info" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} placeholder="Bank Name: Example Bank&#10;Account #: 123456789" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotation-terms">Terms & Conditions</Label>
          <Textarea id="quotation-terms" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Quotation valid for 30 days." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotation-logo-upload">Company Logo</Label>
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
                <Input id="quotation-logo-upload" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleFileChange} />
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
