'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserNav } from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const baseNavItems = [
  { href: '/', label: '홈' },
  { href: '/reading', label: '타로리딩' },
  { href: '/dream-interpretation', label: '꿈해몽' },
  { href: 'https://blog.innerspell.com', label: '블로그' },
  { href: '/community', label: '커뮤니티' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAdminLink = mounted && !loading && user?.role === 'admin';
  const isLoading = !mounted || loading;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="md:pl-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="InnerSpell 로고" width={32} height={32} className="h-8 w-8" />
            <span className="font-headline text-2xl font-bold text-primary">InnerSpell</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {baseNavItems.map((item) => {
              const isExternal = item.href.startsWith('http');
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition-colors hover:text-primary text-foreground/80"
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            {isLoading ? (
              <Skeleton className="h-5 w-12 rounded-md" />
            ) : showAdminLink ? (
              <Link
                href="/admin"
                className="transition-colors hover:text-primary text-foreground/80 font-semibold text-accent"
              >
                관리자
              </Link>
            ) : null}
          </nav>

          <div className="hidden md:block border-l border-border/40 h-6 mx-4"></div>

          <UserNav />
          <ThemeToggle />

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-background p-0">
                <SheetHeader className="p-4 border-b border-border/40">
                  <SheetTitle className="flex items-center space-x-2">
                    <Image src="/logo.png" alt="InnerSpell 로고" width={28} height={28} />
                    <span className="font-headline text-xl font-bold text-primary">InnerSpell</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-4 space-y-2">
                  {baseNavItems.map((item) => {
                     const isExternal = item.href.startsWith('http');
                     return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                        >
                          {item.label}
                        </Link>
                     );
                  })}
                  {isLoading ? (
                    <div className="rounded-md px-3 py-2">
                       <Skeleton className="h-5 w-16" />
                    </div>
                  ) : showAdminLink ? (
                     <Link
                        href="/admin"
                        className="block rounded-md px-3 py-2 text-base font-semibold text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        관리자
                      </Link>
                  ) : null}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
