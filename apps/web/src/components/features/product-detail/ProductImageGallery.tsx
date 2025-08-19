'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useImages } from '@/hooks/useImages';
import { Product } from '@/types';

interface ProductImageGalleryProps {
  product: Product;
}

export default function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const { getProxiedImageUrl } = useImages();

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="aspect-square overflow-hidden rounded-2xl bg-white shadow-lg"
      >
        <ImageWithFallback
          src={getProxiedImageUrl(product.image)}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Thumbnail images (simulated - same image for demo) */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
              selectedImage === index
                ? "border-brand-500"
                : "border-slate-200"
            }`}
            onClick={() => setSelectedImage(index)}
          >
            <ImageWithFallback
              src={getProxiedImageUrl(product.image)}
              alt={`${product.title} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
