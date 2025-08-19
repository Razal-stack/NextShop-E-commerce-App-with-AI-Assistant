'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductsGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  onClearFilters: () => void;
}

export default function ProductsGrid({ 
  products, 
  viewMode, 
  isLoading, 
  onClearFilters 
}: ProductsGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading products...</h3>
        <p className="text-slate-600">Please wait while we fetch the latest products for you.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-600 mb-4">
          Try adjusting your search criteria or filters to find what you're looking for.
        </p>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        >
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={`grid gap-6 mb-8 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}
    >
      <AnimatePresence mode="wait">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
