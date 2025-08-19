'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { Product } from '@/types';
import QuantityControls from './QuantityControls';
import { useImages } from '@/hooks/useImages';
import { NavigationHelper } from '@/utils/navigation';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  showWishlistButton?: boolean;
  showQuantityControls?: boolean;
  showAddToCart?: boolean;
  showRating?: boolean;
  showCategory?: boolean;
  showDescription?: boolean;
  isInWishlist?: boolean;
  quantity?: number;
  onWishlistToggle?: (product: Product) => void;
  onQuantityChange?: (product: Product, change: number) => void;
  onAddToCart?: (product: Product) => void;
  onClick?: (product: Product) => void;
  className?: string;
  navigationContext?: {
    from: string;
    label: string;
  };
}

export default function ProductCard({
  product,
  viewMode = 'grid',
  showWishlistButton = true,
  showQuantityControls = true,
  showAddToCart = true,
  showRating = true,
  showCategory = true,
  showDescription = false,
  isInWishlist = false,
  quantity = 0,
  onWishlistToggle,
  onQuantityChange,
  onAddToCart,
  onClick,
  className = '',
  navigationContext
}: ProductCardProps) {
  const router = useRouter();
  const { getProxiedImageUrl } = useImages();

  const handleClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      // Set navigation context if provided
      if (navigationContext) {
        NavigationHelper.setProductNavigationContext(
          navigationContext.from,
          navigationContext.label
        );
      }
      router.push(`/products/${product.id}`);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWishlistToggle?.(product);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleQuantityIncrease = () => {
    onQuantityChange?.(product, 1);
  };

  const handleQuantityDecrease = () => {
    onQuantityChange?.(product, -1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/50 ${
        viewMode === 'list' ? 'flex' : 'flex flex-col h-full'
      } ${className}`}
    >
      <div 
        className={`cursor-pointer ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'}`}
        onClick={handleClick}
      >
        <div className={`relative overflow-hidden ${viewMode === 'list' ? 'h-48' : 'aspect-square'}`}>
          <ImageWithFallback
            src={getProxiedImageUrl(product.image)}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {showWishlistButton && (
            <div className="absolute top-3 right-3">
              <Button
                size="icon"
                variant="secondary"
                className={`w-8 h-8 rounded-full transition-opacity bg-white/90 hover:bg-white ${
                  isInWishlist 
                    ? 'opacity-100 text-red-500' 
                    : 'opacity-0 group-hover:opacity-100 text-slate-600'
                }`}
                onClick={handleWishlistClick}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col'}`}>
        <div 
          className={`cursor-pointer ${viewMode === 'grid' ? 'flex-1' : ''}`}
          onClick={handleClick}
        >
          <h3 className={`font-semibold text-slate-900 line-clamp-2 mb-2 ${viewMode === 'grid' ? 'min-h-[2.5rem]' : ''}`}>
            {product.title}
          </h3>
          
          {showDescription && viewMode === 'list' && (
            <p className="text-slate-600 text-sm line-clamp-3 mb-3">{product.description}</p>
          )}
          
          {(showRating || showCategory) && (
            <div className="flex items-center space-x-2 mb-3">
              {showRating && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-gold-500 fill-current" />
                  <span className="text-sm text-slate-600 ml-1">{product.rating.rate}</span>
                  <span className="text-xs text-slate-400 ml-1">({product.rating.count})</span>
                </div>
              )}
              {showCategory && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Price and Actions */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-green-600">£{product.price.toFixed(2)}</span>
          
          {showQuantityControls && quantity > 0 ? (
            <QuantityControls
              quantity={quantity}
              onIncrease={handleQuantityIncrease}
              onDecrease={handleQuantityDecrease}
            />
          ) : showAddToCart && (
            <Button
              size="sm"
              onClick={handleAddToCartClick}
              className="btn-icon-add-cart px-3 py-1"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
