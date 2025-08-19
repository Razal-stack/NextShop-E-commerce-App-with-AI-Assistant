'use client';

import React from "react";
import { motion } from "framer-motion";
import { Grid3X3, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCategoriesWithData } from "@/hooks/useCategories";
import { NavigationHelper } from "@/utils/navigation";

export default function CategoriesWidget() {
  const router = useRouter();
  const { categories, loading } = useCategoriesWithData(4); // Get first 4 categories

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-800">
                Shop by Category
              </h3>
              <Grid3X3 className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-8">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl p-4 bg-slate-200 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-300 rounded-xl"></div>
                      <div>
                        <div className="h-5 w-24 bg-slate-300 rounded mb-1"></div>
                        <div className="h-4 w-16 bg-slate-300 rounded"></div>
                      </div>
                    </div>
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
      transition={{ delay: 0.2 }}
    >
      <Card className="h-full overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-800">
              Shop by Category
            </h3>
            <Grid3X3 className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.3 + index * 0.1,
                }}
                className={`group relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${category.bgColor}`}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => {
                  NavigationHelper.navigateToProductsWithFilters(router, {
                    filters: { category: category.slug },
                    showFilters: true,
                    title: `${category.name} Products`,
                    description: `Browse all products in ${category.name.toLowerCase()} category`
                  });
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {category.name}
                      </h4>
                      <p className="text-white/80 text-sm">
                        {category.count} products
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
