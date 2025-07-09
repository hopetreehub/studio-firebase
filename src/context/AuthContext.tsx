
'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { LoaderCircle } from 'lucide-react';
import { getUserProfile, type AppUser } from '@/actions/userActions';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true); // Single loading state for initial auth check
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshUser = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // This effect runs on the client.
    // It sets up the listener for auth state changes.
    // The 'loading' state will be true until this listener gets the first response.
    if (!auth) {
      console.warn("AuthProvider: Firebase auth is not initialized. Skipping auth state listener.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        const profile = await getUserProfile(currentFirebaseUser.uid);
        
        // This is a safety check for admin roles based on email
        const adminEmails = ['admin@innerspell.com', 'junsupark9999@gmail.com'];
        if (profile) {
           if (adminEmails.includes(profile.email || '')) {
             profile.role = 'admin';
           }
           setUser(profile);
        } else {
           // Fallback for new users where profile might not exist yet
           setUser({
              uid: currentFirebaseUser.uid,
              email: currentFirebaseUser.email,
              displayName: currentFirebaseUser.displayName,
              photoURL: currentFirebaseUser.photoURL,
              role: adminEmails.includes(currentFirebaseUser.email || '') ? 'admin' : 'user',
              subscriptionStatus: 'free',
            });
        }

      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false); // Auth check is complete, set loading to false.
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  // On the server, `loading` is always true, so we render the spinner.
  // On the client, the initial render also has `loading` as true, so it renders the spinner, matching the server.
  // After `onAuthStateChanged` fires, `loading` becomes false, and the component re-renders with the children.
  // This is the standard, safe pattern to prevent hydration mismatches for auth state.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
