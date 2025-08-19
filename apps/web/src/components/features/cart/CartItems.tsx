'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ItemListItem, QuantityControls } from '@/components/shared';
import { Product } from '@/types';

interface CartItemsProps {
  items: Array<Product & { quantity: number }>;
  onItemClick: (item: Product) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

export default function CartItems({ 
  items, 
  onItemClick, 
  onUpdateQuantity, 
  onRemoveItem 
}: CartItemsProps) {
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
                showQuantity={true}
                actions={
                  <>
                    <QuantityControls
                      quantity={item.quantity}
                      onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      onDecrease={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    />

                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-lg text-brand-600">
                        £{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 btn-icon-delete"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
