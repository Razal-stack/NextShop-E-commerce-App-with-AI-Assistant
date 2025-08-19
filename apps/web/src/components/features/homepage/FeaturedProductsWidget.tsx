'use client';

import React from "react";
import { motion } from "framer-motion";
import { Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import { NavigationHelper } from "@/utils/navigation";

export default function FeaturedProductsWidget() {
  const router = useRouter();
  const { products: featuredProducts, loading } = useFeaturedProducts(4);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-12"
      >
        <Card className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-slate-800">
                  Featured Products
                </h3>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const filterConfig = NavigationHelper.getWidgetFilterConfig('featured');
                  NavigationHelper.navigateToProductsWithFilters(router, filterConfig);
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>View All</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm animate-pulse"
                >
                  <div className="aspect-square w-full bg-slate-200 rounded-lg mb-4"></div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-slate-200 rounded mb-2"></div>
                  <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
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
      transition={{ delay: 0.8 }}
      className="mb-12"
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-slate-800">
                Featured Products
              </h3>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const filterConfig = NavigationHelper.getWidgetFilterConfig('featured');
                NavigationHelper.navigateToProductsWithFilters(router, filterConfig);
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>View All</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
            {featuredProducts.map((product: Product, index: number) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                delay={0.9}
                navigationContext={{
                  from: '/',
                  label: 'Back to Home'
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
