
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
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  useEffect(() => {
    // This ensures that we don't try to render different things on server and client.
    setInitialRenderComplete(true);
  }, []);

  const refreshUser = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
        if (currentFirebaseUser) {
          setFirebaseUser(currentFirebaseUser);

          // Eagerly check for admin email to ensure immediate admin recognition
          const adminEmails = ['admin@innerspell.com', 'junsupark9999@gmail.com'];
          const isAdminByEmail = adminEmails.includes(currentFirebaseUser.email || '');
          const profile = await getUserProfile(currentFirebaseUser.uid);
          
          if (profile) {
             // Ensure the profile reflects the hardcoded admin rule, just in case.
             if (isAdminByEmail) {
               profile.role = 'admin';
             }
             setUser(profile);
          } else {
            // Fallback for when profile doc doesn't exist yet for a new user
            setUser({
              uid: currentFirebaseUser.uid,
              email: currentFirebaseUser.email,
              displayName: currentFirebaseUser.displayName,
              photoURL: currentFirebaseUser.photoURL,
              role: isAdminByEmail ? 'admin' : 'user', // Apply admin role here too
              subscriptionStatus: 'free',
            });
          }
        } else {
          setUser(null);
          setFirebaseUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
      setUser(null);
      setFirebaseUser(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // We show a spinner until the initial client render is complete AND Firebase has checked the auth state.
  // This prevents the hydration mismatch.
  if (!initialRenderComplete || loading) {
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
