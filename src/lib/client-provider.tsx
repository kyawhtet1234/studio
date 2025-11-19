
'use client';

import { getClientServices } from '@/lib/firebase';
import { useState, useEffect, ReactNode } from 'react';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseProvider } from '@/lib/provider';
import type { FirebaseApp } from 'firebase/app';

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
        // The loader in AppContent will be shown while services are initializing.
        return null;
    }

    return (
        <FirebaseProvider app={services.app} auth={services.auth} db={services.db}>
            {children}
        </FirebaseProvider>
    );
}
