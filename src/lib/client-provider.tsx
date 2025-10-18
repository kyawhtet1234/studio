
'use client';

import { getClientServices } from '@/lib/firebase';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseServices {
    auth: Auth;
    db: Firestore;
}

const FirebaseContext = createContext<FirebaseServices | null>(null);

export function useFirebase() {
    const context = useContext(FirebaseContext);
    if (context === null) {
        throw new Error('useFirebase must be used within a FirebaseClientProvider');
    }
    return context;
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
    const [services, setServices] = useState<FirebaseServices | null>(null);

    useEffect(() => {
        // getClientServices is memoized and only runs on the client.
        const { auth, db } = getClientServices();
        setServices({ auth, db });
    }, []);

    if (!services) {
        // You can render a loader here if you want.
        // For now, we render nothing, and the loader in AppContent will be shown.
        return null; 
    }

    return (
        <FirebaseContext.Provider value={services}>
            {children}
        </FirebaseContext.Provider>
    );
}
