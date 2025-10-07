
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/data-context';
import type { BrandingSettings as BrandingSettingsType } from '@/lib/types';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

export function BrandingSettings() {
  const { toast } = useToast();
  const { settings, updateBrandingSettings } = useData();

  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    if (settings.branding) {
      setAppName(settings.branding.appName || 'THE CRAFT SHOP LEDGER');
      setAppLogo(settings.branding.appLogo || null);
    } else {
      setAppName('THE CRAFT SHOP LEDGER');
    }
  }, [settings.branding]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        setAppLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const newSettings: BrandingSettingsType = {
      appName,
      appLogo,
    };
    await updateBrandingSettings(newSettings);
    toast({
      title: 'Settings Saved',
      description: 'Your branding settings have been updated.',
    });
  };
  
  const handleRemoveLogo = () => {
    setAppLogo(null);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>App Branding</CardTitle>
        <CardDescription>Customize the name and logo of your application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="app-name">App Name</Label>
          <Input 
            id="app-name" 
            value={appName} 
            onChange={(e) => setAppName(e.target.value)} 
            placeholder="e.g., My Business Ledger" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo-upload">App Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-md border border-dashed flex items-center justify-center bg-muted/50">
              {appLogo ? (
                <Image src={appLogo} alt="Logo preview" width={96} height={96} className="object-contain w-full h-full rounded-md" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="mx-auto h-8 w-8" />
                  <span className="text-xs">Preview</span>
                </div>
              )}
            </div>
            <div className="flex-1">
                <Input id="logo-upload" type="file" accept="image/png" onChange={handleLogoChange} />
                <p className="text-xs text-muted-foreground mt-2">Upload a PNG file. Max 1MB.</p>
            </div>
              {appLogo && (
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
