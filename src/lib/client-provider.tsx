
'use client';

import { getClientServices } from '@/lib/firebase';
import { useState, useEffect, ReactNode } from 'react';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '@/lib/provider';
import type { FirebaseApp } from 'firebase/app';
import { AuthProvider } from './auth-context';
import { DataProvider } from './data-context';
import { Loader2 } from 'lucide-react';

interface FirebaseClientProviderProps {
    children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
    const [services, setServices] = useState<{ app: FirebaseApp; auth: Auth; db: Firestore; } | null>(null);

    useEffect(() => {
        // getClientServices is memoized and only runs on the client.
        const { app, auth, db } = getClientServices();
        setServices({ app, auth, db });
    }, []);

    if (!services) {
        // A simple loader until the firebase services are initialized.
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <FirebaseProvider app={services.app} auth={services.auth} db={services.db}>
            <AuthProvider>
                <DataProvider>
                    {children}
                </DataProvider>
            </AuthProvider>
        </FirebaseProvider>
    );
}
