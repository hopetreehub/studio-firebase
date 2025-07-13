
'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
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

  const refreshUser = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!auth) {
      console.warn("AuthProvider: Firebase auth is not initialized. Skipping auth state listener.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        let profile = await getUserProfile(currentFirebaseUser.uid);
        
        // If profile doesn't exist (e.g., new Google sign-in), create a default one.
        if (!profile) {
          const adminEmails = (process.env.ADMIN_EMAILS || 'admin@innerspell.com,junsupark9999@gmail.com').split(',');
          const newAppUser: AppUser = {
            uid: currentFirebaseUser.uid,
            email: currentFirebaseUser.email,
            displayName: currentFirebaseUser.displayName,
            photoURL: currentFirebaseUser.photoURL,
            creationTime: currentFirebaseUser.metadata.creationTime,
            lastSignInTime: currentFirebaseUser.metadata.lastSignInTime,
            role: adminEmails.includes(currentFirebaseUser.email || '') ? 'admin' : 'user',
            birthDate: '',
            sajuInfo: '',
            subscriptionStatus: 'free',
          };
          profile = newAppUser;
        }

        setUser(profile);

      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  const value = { user, firebaseUser, loading, refreshUser };

  return (
    <AuthContext.Provider value={value}>
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
