'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';

interface ProductPricingProps {
  product: Product;
  quantity: number;
  setQuantity: (quantity: number) => void;
}

export default function ProductPricing({ product, quantity, setQuantity }: ProductPricingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-baseline space-x-2">
        <span className="text-4xl font-bold text-green-600">
          £{product.price.toFixed(2)}
        </span>
        <span className="text-gray-500 line-through">
          £{(product.price * 1.2).toFixed(2)}
        </span>
        <Badge variant="destructive">17% OFF</Badge>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <span className="font-medium">Quantity:</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="btn-secondary h-10 w-10"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-12 text-center font-medium">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
            className="btn-secondary h-10 w-10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
