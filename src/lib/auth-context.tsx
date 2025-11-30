
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { useFirebase } from './firebase-provider';

export type ActiveUserRole = 'admin' | 'salesperson';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeUserRole: ActiveUserRole | null;
  setActiveUserRole: (role: ActiveUserRole | null) => void;
  signUp: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  logOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUserRole, setActiveUserRole] = useState<ActiveUserRole | null>(null);


  useEffect(() => {
    if (!auth) {
        setLoading(true);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (!user) {
          setActiveUserRole(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
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
    setActiveUserRole(null);
    return signOut(auth);
  };

  const value = { user, loading, signUp, signIn, logOut, activeUserRole, setActiveUserRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
