'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useImages } from '@/hooks/useImages';
import { Product } from '@/types';

interface ItemListItemProps {
  item: Product & { quantity?: number };
  onItemClick?: (item: Product) => void;
  actions?: React.ReactNode;
  showQuantity?: boolean;
  pricePrefix?: string;
  className?: string;
}

export default function ItemListItem({
  item,
  onItemClick,
  actions,
  showQuantity = false,
  pricePrefix = '',
  className = ''
}: ItemListItemProps) {
  const { getProxiedImageUrl } = useImages();
  
  const handleClick = () => {
    onItemClick?.(item);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex space-x-4 p-4 rounded-xl border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all duration-200 bg-white ${className}`}
    >
      <div 
        className="flex-shrink-0 cursor-pointer group"
        onClick={handleClick}
      >
        <ImageWithFallback
          src={getProxiedImageUrl(item.image)}
          alt={item.title}
          className="w-16 h-16 object-cover rounded-lg border border-slate-100 group-hover:border-brand-300 transition-colors duration-200"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold text-slate-900 line-clamp-2 mb-2 leading-snug cursor-pointer hover:text-brand-600 transition-colors duration-200"
          onClick={handleClick}
        >
          {item.title}
        </h4>
        <p className={`font-medium mb-3 ${showQuantity ? 'text-sm text-green-600' : 'text-lg font-bold text-brand-600'}`}>
          {pricePrefix}£{item.price.toFixed(2)}{showQuantity ? ' each' : ''}
        </p>

        {actions && (
          <div className="flex items-center justify-between">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}
