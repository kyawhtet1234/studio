

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Briefcase, LogOut } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function UserSelector() {
  const { setActiveUserRole, logOut } = useAuth();
  const { settings } = useData();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  const appName = settings.branding?.appName || 'CloudPOS';
  const appLogo = settings.branding?.appLogo;
  const adminPin = settings.users?.adminPin;

  const handleAdminClick = () => {
    if (adminPin) {
      setShowPinInput(true);
    } else {
      // If no PIN is set, log in as admin directly
      setActiveUserRole('admin');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === adminPin) {
      setActiveUserRole('admin');
    } else {
      toast({
        variant: 'destructive',
        title: 'Incorrect PIN',
        description: 'The PIN you entered is incorrect. Please try again.',
      });
      setPin('');
    }
  };

  const handleSalespersonClick = () => {
    setActiveUserRole('salesperson');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="absolute top-8 right-8">
        <Button variant="ghost" onClick={logOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
        </Button>
      </div>
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          {appLogo && <Image src={appLogo} alt="Logo" width={120} height={120} className="mx-auto mb-4" />}
          <CardTitle className="text-2xl font-bold">Welcome to {appName}</CardTitle>
          <CardDescription>Please select your role to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showPinInput ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleAdminClick}
                className="group flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-6 transition-colors hover:bg-muted"
              >
                <Shield className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
                <span className="font-semibold">Admin</span>
              </button>
              <button
                onClick={handleSalespersonClick}
                className="group flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-6 transition-colors hover:bg-muted"
              >
                <Briefcase className="h-10 w-10 text-secondary-foreground transition-transform group-hover:scale-110" />
                <span className="font-semibold">Salesperson</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
              <h3 className="text-center font-semibold">Enter Admin PIN</h3>
              <div className="space-y-2">
                <Label htmlFor="pin-input" className="sr-only">PIN</Label>
                <Input
                  id="pin-input"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="text-center text-xl tracking-[1em]"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <Button type="button" variant="outline" onClick={() => setShowPinInput(false)}>
                    Back
                </Button>
                <Button type="submit">Unlock</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
