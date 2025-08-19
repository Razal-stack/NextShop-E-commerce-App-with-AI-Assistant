'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemListItem } from '@/components/shared';
import { Product } from '@/types';

interface WishlistItemsProps {
  items: Product[];
  onItemClick: (item: Product) => void;
  onAddToCart: (item: Product) => void;
  onRemoveItem: (productId: number) => void;
}

export default function WishlistItems({ 
  items, 
  onItemClick, 
  onAddToCart, 
  onRemoveItem 
}: WishlistItemsProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="h-full px-6 py-2 overflow-y-auto scrollbar-thin">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <ItemListItem
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                actions={
                  <div className="flex justify-between items-center w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-destructive px-3 py-1"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => onAddToCart(item)}
                      className="btn-primary px-4 py-2"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
