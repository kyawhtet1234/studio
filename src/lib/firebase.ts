
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

// Memoization variables to ensure Firebase is initialized only once.
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Initializes and returns client-side Firebase services.
 * This function is memoized to prevent re-initialization on every call.
 */
export function getClientServices() {
    if (typeof window !== 'undefined') {
        if (!app) { // Only initialize if it hasn't been already
            if (getApps().length > 0) {
                app = getApp();
            } else {
                app = initializeApp(firebaseConfig);
            }
            auth = getAuth(app);
            db = getFirestore(app);
        }
    }
    // On the server, this will return undefined for client-side services.
    // This is expected and handled by components that use this function.
    return { app: app!, db: db!, auth: auth! };
}
