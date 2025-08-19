'use client';

import { AuthLayout, RegisterForm } from '../../../src/components/features/auth';
import { Gift, Crown, Zap, Star } from 'lucide-react';

const registerFeatures = [
  {
    icon: Gift,
    title: 'Welcome Bonus',
    description: 'Get a bonus credit when you create your account'
  },
  {
    icon: Crown,
    title: 'Member Deals',
    description: 'Access to exclusive discounts and special offers'
  },
  {
    icon: Zap,
    title: 'Fast Shipping',
    description: 'Quick delivery on your orders'
  },
  {
    icon: Star,
    title: 'Customer Support',
    description: 'Dedicated support for all your shopping needs'
  }
];

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join NextShop to start shopping with personalized recommendations and member benefits."
      features={registerFeatures}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
