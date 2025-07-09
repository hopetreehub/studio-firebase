'use client';

import type React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth state and redirects are now handled by AuthProvider and individual pages.
  // This layout component can be simplified to focus solely on structure.
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
