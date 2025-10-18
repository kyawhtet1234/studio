
'use client';

import { AppSidebar } from '@/components/app/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DataProvider, useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/app/app-header';
import { FirebaseClientProvider } from '@/lib/client-provider';

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading: dataLoading } = useData();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || (user && dataLoading)) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  if (!user) {
      return null;
  }

  return (
    <SidebarProvider>
        <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <SidebarInset>
                <div className="flex flex-col flex-1">
                    <AppHeader />
                    <main className="p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </div>
    </SidebarProvider>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
          <DataProvider>
              <AppContent>{children}</AppContent>
          </DataProvider>
        </FirebaseClientProvider>
    )
}
