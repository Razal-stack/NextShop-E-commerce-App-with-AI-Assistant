import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - NextShop',
  description: 'Sign in or create your NextShop account',
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen pt-16">
      {children}
    </div>
  );
}
