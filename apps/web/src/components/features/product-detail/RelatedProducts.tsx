'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useImages } from '@/hooks/useImages';
import { NavigationHelper } from '@/utils/navigation';
import { Product } from '@/types';

interface RelatedProductsProps {
  relatedProducts: Product[];
}

export default function RelatedProducts({ relatedProducts }: RelatedProductsProps) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { getProxiedImageUrl } = useImages();

  const handleRelatedProductClick = (relatedProduct: Product) => {
    // Set navigation context to come back to current product
    NavigationHelper.setProductNavigationContext(
      `/products/${id}`,
      'Back to Product'
    );
    router.push(`/products/${relatedProduct.id}`);
  };

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-8">
        Related Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((relatedProduct: Product, index: number) => (
          <motion.div
            key={relatedProduct.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group cursor-pointer"
            onClick={() => handleRelatedProductClick(relatedProduct)}
          >
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-slate-200/50">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <ImageWithFallback
                    src={getProxiedImageUrl(relatedProduct.image)}
                    alt={relatedProduct.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                    {relatedProduct.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-600">
                      £{relatedProduct.price.toFixed(2)}
                    </span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-gold-500 fill-current" />
                      <span className="text-sm text-slate-600 ml-1">
                        {relatedProduct.rating.rate}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
