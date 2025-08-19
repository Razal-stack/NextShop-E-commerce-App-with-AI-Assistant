'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Badge variant="outline" className="mb-3">
        {product.category}
      </Badge>
      <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
        {product.title}
      </h1>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < Math.floor(product.rating.rate)
                  ? "text-gold-500 fill-current"
                  : "text-slate-300"
              }`}
            />
          ))}
        </div>
        <span className="text-slate-600">
          {product.rating.rate} ({product.rating.count} reviews)
        </span>
      </div>

      <p className="text-slate-700 leading-relaxed mb-6">
        {product.description}
      </p>
    </motion.div>
  );
}
