'use client';

import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';

interface ProductActionsProps {
  product: Product;
  quantity: number;
  isInWishlist: boolean;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
}

export default function ProductActions({ 
  product, 
  quantity, 
  isInWishlist, 
  onAddToCart, 
  onToggleWishlist 
}: ProductActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button
        onClick={onAddToCart}
        className="btn-primary flex-1 h-12 text-white"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Add to Cart - £{(product.price * quantity).toFixed(2)}
      </Button>
      <Button
        variant="outline"
        onClick={onToggleWishlist}
        className={`h-12 px-6 ${isInWishlist ? "btn-destructive" : "btn-secondary"}`}
      >
        <Heart
          className={`w-5 h-5 mr-2 ${isInWishlist ? "fill-current" : ""}`}
        />
        {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>
    </div>
  );
}
