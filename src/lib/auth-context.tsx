
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { useAuth as useFirebaseCoreAuth } from '@/lib/provider'; // Use the core provider

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUserRole, setActiveUserRole] = useState<ActiveUserRole | null>(null);
  const auth = useFirebaseCoreAuth(); // Get auth from the central provider

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (!user) {
          // Clear active role on logout
          setActiveUserRole(null);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const signUp = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = () => {
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
