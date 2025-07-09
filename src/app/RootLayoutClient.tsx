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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // To prevent hydration mismatch, we must render a static shell on the server and on the initial client render.
  // We only render the dynamic content after the component has mounted on the client.
  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  // Once mounted, we can safely check the auth loading state to show the spinner.
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }
  
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/finish-sign-in';

  if (isAuthPage) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <AppLayout>{children}</AppLayout>;
}
