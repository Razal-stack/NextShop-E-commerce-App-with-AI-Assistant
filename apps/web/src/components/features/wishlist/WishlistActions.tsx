'use client';

import React from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WishlistActionsProps {
  itemCount: number;
  onContinueShopping: () => void;
}

export default function WishlistActions({ itemCount, onContinueShopping }: WishlistActionsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Bookmark className="w-4 h-4 text-slate-500" />
          <p className="text-sm text-slate-600">
            {itemCount} item{itemCount !== 1 ? 's' : ''} saved for later
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onContinueShopping}
          className="w-full h-12 btn-primary"
        >
          Continue Shopping
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
