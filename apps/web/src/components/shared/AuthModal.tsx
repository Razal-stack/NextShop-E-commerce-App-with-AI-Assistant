'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: 'cart' | 'wishlist';
  productTitle?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  action = 'cart',
  productTitle 
}: AuthModalProps) {
  const router = useRouter();

  const handleSignIn = () => {
    onClose();
    router.push('/auth/signin');
  };

  const handleRegister = () => {
    onClose();
    router.push('/auth/register');
  };

  const actionText = action === 'cart' ? 'add to cart' : 'add to wishlist';
  const ActionIcon = action === 'cart' ? ShoppingCart : Heart;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <DialogHeader className="text-center mb-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 flex items-center justify-center shadow-lg">
              <ActionIcon className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Sign in required
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              {productTitle 
                ? `To ${actionText} "${productTitle.length > 50 ? productTitle.substring(0, 50) + '...' : productTitle}", please sign in to your account or create a new one.`
                : `To ${actionText}, please sign in to your account or create a new one.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4">
            <Button
              onClick={handleSignIn}
              className="btn-primary w-full h-12"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-500 font-medium">
                  Or
                </span>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              variant="outline"
              className="btn-secondary w-full h-12"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Create Account
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="btn-ghost w-full h-10"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
