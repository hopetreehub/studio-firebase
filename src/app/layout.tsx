
import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import RootLayoutClient from './RootLayoutClient';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), // Added for resolving relative image paths
  title: {
    default: 'InnerSpell - 당신의 내면을 탐험하세요',
    template: '%s - InnerSpell',
  },
  description: 'AI 기반 타로 해석과 함께 현대적인 영적 타로 서비스를 경험하세요. 타로 카드 리딩, 카드 백과사전, 영적 성장 블로그를 제공합니다.',
  keywords: ['타로', 'AI 타로', '타로카드', '운세', '점성술', '영적 성장', '명상', 'InnerSpell', '인공지능 타로', '타로 리딩', '타로 해석'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'InnerSpell',
    title: {
      default: 'InnerSpell - 당신의 내면을 탐험하세요',
      template: '%s - InnerSpell',
    },
    description: 'AI 기반 타로 해석, 타로 카드 백과사전, 영적 성장 블로그를 통해 당신의 내면을 발견하세요.',
    images: [
      {
        url: '/logo-og.png', 
        width: 1200,
        height: 630,
        alt: 'InnerSpell 로고',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: 'InnerSpell - 당신의 내면을 탐험하세요',
      template: '%s - InnerSpell',
    },
    description: 'AI 기반 타로 해석, 타로 카드 백과사전, 영적 성장 블로그를 통해 당신의 내면을 발견하세요.',
    images: [`${siteUrl}/logo-og.png`], // Ensure absolute URL for Twitter
    // site: '@yourTwitterHandle', 
    // creator: '@creatorTwitterHandle', 
  },
  icons: null, // Explicitly disable auto icon generation to prevent 404 errors
};

export const viewport: Viewport = {
  themeColor: [ 
    { media: '(prefers-color-scheme: light)', color: '#F3E5F5' }, // Light theme background
    { media: '(prefers-color-scheme: dark)', color: '#221C2E' },  // Dark theme background (approximated)
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet" />
        {/* 
          If you are integrating Google AdSense, the script provided by AdSense
          would typically be placed here, or in a Script component from next/script
          for better performance management. Example:
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
               crossOrigin="anonymous"></script> 
        */}
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
