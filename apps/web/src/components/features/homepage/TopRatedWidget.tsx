'use client';

import React from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { useImages } from "@/hooks/useImages";
import { useTopRatedProducts } from "@/hooks/useTopRatedProducts";
import { NavigationHelper } from "@/utils/navigation";
import { Product } from "@/types";

export default function TopRatedWidget() {
  const router = useRouter();
  const { getProxiedImageUrl } = useImages();
  const { products: topRatedProducts, loading } = useTopRatedProducts(4);

  const handleProductClick = (product: Product) => {
    NavigationHelper.setProductNavigationContext('/', 'Back to Home');
    router.push(`/products/${product.id}`);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          className="h-full overflow-hidden border-0 shadow-xl"
          style={{ backgroundColor: "#fff7f2" }}
        >
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">
                Top Rated
              </h3>
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-orange-50/50 animate-pulse"
                >
                  <div className="w-16 h-16 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card
        className="h-full overflow-hidden border-0 shadow-xl"
        style={{ backgroundColor: "#fff7f2" }}
      >
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-800">
              Top Rated
            </h3>
            <Star className="w-6 h-6 text-yellow-500 fill-current" />
          </div>
          <div className="space-y-4">
            {topRatedProducts.map((product: Product, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.5 + index * 0.1,
                }}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-orange-50/50 transition-all cursor-pointer group"
                whileHover={{ scale: 1.01 }}
                onClick={() => handleProductClick(product)}
              >
                <div className="relative overflow-hidden rounded-lg">
                  <ImageWithFallback
                    src={getProxiedImageUrl(product.image)}
                    alt={product.title}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-700">
                    {product.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-slate-600 ml-1">
                        {product.rating.rate}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      £{product.price}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
