
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how you would like the app to look. The theme will be saved for your next visit.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline"
            className={cn("h-24 flex flex-col gap-2", theme === 'light' && 'border-primary ring-2 ring-primary')}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-6 w-6" />
            Light
          </Button>
          <Button
            variant="outline"
            className={cn("h-24 flex flex-col gap-2", theme === 'dark' && 'border-primary ring-2 ring-primary')}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-6 w-6" />
            Dark
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
