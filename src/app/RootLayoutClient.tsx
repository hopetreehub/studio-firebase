'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/context/AuthContext';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // First, handle the server-side render and the initial client-side render identically.
  // By checking `!isClient`, we ensure this block runs on the server and on the very first client render,
  // before the `useEffect` has a chance to run. This guarantees the output matches.
  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  // After the component has mounted on the client, `isClient` is true.
  // Now we can safely check for auth loading state.
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  // Once we are on the client and auth is not loading, we can render the correct layout.
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/finish-sign-in';

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <AppLayout>{children}</AppLayout>;
}
