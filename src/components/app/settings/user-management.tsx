

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/data-context';
import type { UserManagementSettings } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

const allPages = [
    { id: '/sales', label: 'Sales' },
    { id: '/products', label: 'Products' },
    { id: '/purchase', label: 'Purchase' },
    { id: '/inventory', label: 'Inventory' },
    { id: '/transfer', label: 'Transfer' },
    { id: '/reports', label: 'Reports' },
    { id: '/finance', label: 'Finance' },
    { id: '/cash', label: 'Cash' },
    { id: '/employees', label: 'Employees' },
];

export function UserManagement() {
  const { toast } = useToast();
  const { settings, updateUserManagementSettings } = useData();

  const [adminPin, setAdminPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [salespersonEnabled, setSalespersonEnabled] = useState(false);
  const [salespersonPermissions, setSalespersonPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (settings.users) {
      setAdminPin(settings.users.adminPin || '');
      setSalespersonEnabled(settings.users.salesperson?.isEnabled || false);
      setSalespersonPermissions(settings.users.salesperson?.permissions || []);
    }
  }, [settings.users]);

  const handleSave = async () => {
    if (adminPin && !/^\d{4}$/.test(adminPin)) {
        toast({
            variant: 'destructive',
            title: 'Invalid PIN',
            description: 'Admin PIN must be exactly 4 digits.',
        });
        return;
    }
    const newSettings: UserManagementSettings = {
      adminPin: adminPin || undefined,
      salesperson: {
        isEnabled: salespersonEnabled,
        permissions: salespersonPermissions,
      },
    };
    await updateUserManagementSettings(newSettings);
    toast({
      title: 'Settings Saved',
      description: 'User management settings have been updated.',
    });
  };

  const handlePermissionChange = (pageId: string, checked: boolean) => {
    setSalespersonPermissions(prev => 
        checked ? [...prev, pageId] : prev.filter(id => id !== pageId)
    );
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Secure the admin account with a PIN.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-2 max-w-sm">
                    <Label htmlFor="admin-pin">Admin 4-Digit PIN</Label>
                    <div className="relative">
                        <Input 
                            id="admin-pin" 
                            type={showPin ? 'text' : 'password'}
                            value={adminPin} 
                            onChange={(e) => setAdminPin(e.target.value)} 
                            placeholder="Enter a 4-digit PIN"
                            maxLength={4}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPin(!showPin)}
                        >
                            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Salesperson Role</CardTitle>
                <CardDescription>Configure access for the salesperson role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="salesperson-enabled"
                        checked={salespersonEnabled}
                        onCheckedChange={setSalespersonEnabled}
                    />
                    <Label htmlFor="salesperson-enabled">Enable Salesperson Role</Label>
                </div>
                
                <div className={cn("space-y-4", !salespersonEnabled && "opacity-50 pointer-events-none")}>
                    <h4 className="font-medium">Page Permissions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {allPages.map(page => (
                            <div key={page.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`perm-${page.id}`}
                                    checked={salespersonPermissions.includes(page.id)}
                                    onCheckedChange={(checked) => handlePermissionChange(page.id, !!checked)}
                                />
                                <Label htmlFor={`perm-${page.id}`}>{page.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-start">
            <Button onClick={handleSave}>Save User Settings</Button>
        </div>
    </div>
  );
}
