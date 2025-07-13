
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { NewsletterForm } from '@/components/home/NewsletterSignup';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/reading', label: 'Tarot Reading' },
  { href: '/dream-interpretation', label: 'Dream Interpretation' },
  { href: 'https://blog.innerspell.com', label: 'Blog' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
];

const policyItems = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
];

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-border/40 bg-background/95 py-8 text-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8">
          
          <div className="md:col-span-4 flex flex-col">
            <Link href="/" className="inline-flex items-center space-x-2 mb-3 group">
              <Image src="/logo.png" alt="InnerSpell Logo" width={40} height={40} className="h-10 w-10 group-hover:opacity-80 transition-opacity" />
              <span className="font-headline text-3xl font-bold text-primary group-hover:text-primary/80 transition-colors">InnerSpell</span>
            </Link>
            <p className="text-muted-foreground text-xs max-w-xs">
              AI 기반 타로 리딩으로 명확성과 통찰력을 얻으세요. 당신의 내면 탐험을 위한 현대적인 영적 도구입니다.
            </p>
          </div>

          <div className="md:col-span-2 text-left">
            <h3 className="font-semibold text-foreground mb-3 uppercase tracking-wider text-xs">Menu</h3>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-2 text-left">
            <h3 className="font-semibold text-foreground mb-3 uppercase tracking-wider text-xs">Legal</h3>
            <nav className="flex flex-col space-y-2">
              {policyItems.map((item) => (
                <Link key={item.label} href={item.href} className="text-muted-foreground hover:text-primary transition-colors">{item.label}</Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-4 text-left">
            <NewsletterForm />
          </div>
        </div>
        <div className="border-t border-border/20 pt-6 text-center">
            <p className="text-xs text-muted-foreground/80 h-4">
              {year ? `© ${year} InnerSpell. All rights reserved.` : ` `}
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              문의: <a href="mailto:admin@innerspell.com" className="hover:text-primary">admin@innerspell.com</a>
            </p>
        </div>
      </div>
    </footer>
  );
}
