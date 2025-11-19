
'use client';

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// This function initializes Firebase and returns the app, db, and auth instances.
// It ensures that Firebase is only initialized once.
export function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } {
  if (typeof window === 'undefined') {
    // On the server, we don't initialize Firebase.
    // This can be adapted if you need server-side Firebase services (e.g., Admin SDK).
    throw new Error("Firebase should only be initialized on the client side.");
  }

  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  const db = getFirestore(app);
  const auth = getAuth(app);

  return { app, db, auth };
}
