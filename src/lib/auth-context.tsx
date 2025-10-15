
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  Auth,
} from 'firebase/auth';
import { getClientServices } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  logOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    const { auth: clientAuth } = getClientServices();
    setAuth(clientAuth);
  }, []);

  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }
  }, [auth]);

  const signUp = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Auth not initialized"));
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Auth not initialized"));
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = () => {
    if (!auth) return Promise.reject(new Error("Auth not initialized"));
    return signOut(auth);
  };

  const value = { user, loading, signUp, signIn, logOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
