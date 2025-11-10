
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This is a memoized function that initializes and returns client-side Firebase services.
export function getClientServices() {
    if (typeof window !== 'undefined') {
        if (!app) {
            if (getApps().length > 0) {
                app = getApp();
            } else {
                app = initializeApp(firebaseConfig);
            }
            auth = getAuth(app);
            db = getFirestore(app);
        }
    }
    // On the server, this will return undefined, which is handled by components that use it.
    // @ts-ignore
    return { app, db, auth };
}
