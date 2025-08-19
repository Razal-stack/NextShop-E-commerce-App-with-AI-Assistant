'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartActionsProps {
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export default function CartActions({ onCheckout, onContinueShopping }: CartActionsProps) {
  return (
    <div className="space-y-3">
      <Button
        onClick={onCheckout}
        className="btn-primary w-full text-white h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      <Button
        variant="outline"
        onClick={onContinueShopping}
        className="btn-secondary w-full font-medium transition-all duration-200"
      >
        Continue Shopping
      </Button>
    </div>
  );
}
