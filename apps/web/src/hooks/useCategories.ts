/**
 * Enhanced category-related hooks for dynamic category widgets
 */

import { useState, useEffect, useMemo } from 'react';
import { ProductService } from '../services/productService';
import { useProducts } from './useProducts';
import { 
  Smartphone, 
  Shirt, 
  User, 
  Gem, 
  Package,
  Monitor,
  Watch,
  ShoppingBag,
  Star,
  Gift
} from 'lucide-react';

export interface CategoryData {
  name: string;
  slug: string;
  count: number;
  icon: any;
  bgColor: string;
}

// Dynamic icon mapping for categories
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('electronic')) return Smartphone;
  if (categoryLower.includes('jewelry') || categoryLower.includes('jewelery')) return Gem;
  if (categoryLower.includes("men's") || categoryLower.includes('men')) return User;
  if (categoryLower.includes("women's") || categoryLower.includes('women')) return Shirt;
  if (categoryLower.includes('clothing') || categoryLower.includes('apparel')) return ShoppingBag;
  if (categoryLower.includes('watch') || categoryLower.includes('time')) return Watch;
  if (categoryLower.includes('computer') || categoryLower.includes('monitor')) return Monitor;
  if (categoryLower.includes('gift')) return Gift;
  
  // Default icon
  return Package;
};

// Dynamic color mapping for categories
const getCategoryColor = (index: number) => {
  const colors = [
    'bg-gradient-to-r from-purple-500 to-purple-600',
    'bg-gradient-to-r from-emerald-500 to-emerald-600', 
    'bg-gradient-to-r from-pink-400 to-pink-500',
    'bg-gradient-to-r from-yellow-500 to-yellow-600',
    'bg-gradient-to-r from-blue-500 to-blue-600',
    'bg-gradient-to-r from-red-500 to-red-600',
    'bg-gradient-to-r from-indigo-500 to-indigo-600',
    'bg-gradient-to-r from-green-500 to-green-600',
    'bg-gradient-to-r from-orange-500 to-orange-600',
    'bg-gradient-to-r from-teal-500 to-teal-600'
  ];
  
  return colors[index % colors.length];
};

// Format category name for display
const formatCategoryName = (category: string): string => {
  return category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const data = await ProductService.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
  };
}

export function useCategoriesWithData(limit = 4) {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const categoriesWithData = useMemo<CategoryData[]>(() => {
    if (!products.length || !categories.length) return [];
    
    return categories
      .slice(0, limit) // Take only the first 'limit' categories
      .map((category, index) => {
        const productCount = products.filter(
          product => product.category === category
        ).length;
        
        return {
          name: formatCategoryName(category),
          slug: category,
          count: productCount,
          icon: getCategoryIcon(category),
          bgColor: getCategoryColor(index)
        };
      })
      .filter(cat => cat.count > 0); // Only show categories with products
  }, [products, categories, limit]);

  return {
    categories: categoriesWithData,
    loading: productsLoading || categoriesLoading,
    error: null
  };
}

export function useCategoryProducts(categorySlug: string) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategoryProducts() {
      if (!categorySlug) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await ProductService.getProductsByCategory(categorySlug);
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category products');
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryProducts();
  }, [categorySlug]);

  return {
    products,
    loading,
    error,
  };
}
