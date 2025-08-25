import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import Cart from '@/components/features/Cart';
import Wishlist from '@/components/features/Wishlist';
import { NexAssistantWrapper } from '@/components/assistant/NexAssistantWrapper';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NextShop - AI-Powered E-commerce',
  description: 'NextShop with Nex AI Assistant - Premium shopping experience powered by AI',
  keywords: ['ecommerce', 'ai', 'shopping', 'nextjs', 'react'],
  authors: [{ name: 'NextShop Team' }],
  creator: 'NextShop',
  publisher: 'NextShop',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nextshop.dev'),
  openGraph: {
    title: 'NextShop - AI-Powered E-commerce',
    description: 'Premium shopping experience with AI assistant',
    url: 'https://nextshop.dev',
    siteName: 'NextShop',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextShop - AI-Powered E-commerce',
    description: 'Premium shopping experience with AI assistant',
    creator: '@nextshop',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-hidden`}>
        <Providers>
          <div className="flex flex-col h-screen">
            <Header />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </div>
          <Cart />
          <Wishlist />
          <NexAssistantWrapper />
        </Providers>
      </body>
    </html>
  );
}
