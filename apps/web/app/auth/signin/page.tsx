'use client';

import { AuthLayout, SignInForm } from '../../../src/components/features/auth';
import { Sparkles, Zap, Shield, Users } from 'lucide-react';

const signinFeatures = [
  {
    icon: Sparkles,
    title: 'Personalized Experience',
    description: 'Get product recommendations tailored to your preferences'
  },
  {
    icon: Zap,
    title: 'Express Checkout',
    description: 'Save time with one-click purchasing and fast delivery'
  },
  {
    icon: Shield,
    title: 'Secure Shopping',
    description: 'Your data is protected with enterprise-grade security'
  },
  {
    icon: Users,
    title: 'Member Benefits',
    description: 'Access exclusive deals and early product launches'
  }
];

export default function SignInPage() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your premium shopping experience with personalized recommendations and exclusive member benefits."
      features={signinFeatures}
    >
      <SignInForm />
    </AuthLayout>
  );
}
