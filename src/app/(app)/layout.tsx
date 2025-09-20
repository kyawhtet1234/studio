
'use client';

import { AppSidebar } from '@/components/app/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DataProvider } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <DataProvider>
        <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <SidebarInset>
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </SidebarInset>
        </div>
      </DataProvider>
    </SidebarProvider>
  );
}
