
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [firebaseServices, setFirebaseServices] = useState<{
    app: FirebaseApp;
    db: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    // The initializeFirebase function is only called on the client side,
    // ensuring that server-side rendering does not attempt to connect to Firebase.
    const services = initializeFirebase();
    setFirebaseServices(services);
  }, []);

  if (!firebaseServices) {
    // You can render a loading spinner or null here while Firebase is initializing.
    return null;
  }

  return (
    <FirebaseProvider
      app={firebaseServices.app}
      db={firebaseServices.db}
      auth={firebaseServices.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
