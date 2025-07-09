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

  // By checking for isMounted and authLoading, we ensure that the initial server render
  // and the first client render are identical (showing the spinner), preventing hydration mismatch.
  // The actual content is rendered only on the client after it has mounted and auth state is confirmed.
  if (!isMounted || authLoading) {
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
