'use client';

import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <main className={`flex-1 overflow-auto scrollbar-gutter-stable ${!isAuthPage ? 'pt-16' : ''}`}>
      {children}
    </main>
  );
}
