
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

const LOGO_STORAGE_KEY = 'receipt-logo';

export function ReceiptSettings() {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (savedLogo) {
      setLogo(savedLogo);
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
