import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ProductService } from '@/services/productService';

export const useBudgetProducts = (maxPrice: number = 25, limit: number = 4) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgetProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all products and filter for budget-friendly ones
        const allProducts = await ProductService.getProducts();
        const budgetProducts = allProducts
          .filter((product: Product) => product.price <= maxPrice)
          .sort((a: Product, b: Product) => a.price - b.price) // Sort by price asc
          .slice(0, limit);
        
        setProducts(budgetProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch budget products');
        console.error('Error fetching budget products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetProducts();
  }, [maxPrice, limit]);

  return { products, loading, error };
};
