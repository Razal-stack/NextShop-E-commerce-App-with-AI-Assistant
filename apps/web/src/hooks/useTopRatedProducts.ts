import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ProductService } from '@/services/productService';

export const useTopRatedProducts = (limit: number = 4) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopRatedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all products and filter for top rated (rating >= 4.0)
        const allProducts = await ProductService.getProducts();
        const topRated = allProducts
          .filter((product: Product) => product.rating.rate >= 4.0)
          .sort((a: Product, b: Product) => b.rating.rate - a.rating.rate) // Sort by rating desc
          .slice(0, limit);
        
        setProducts(topRated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch top rated products');
        console.error('Error fetching top rated products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedProducts();
  }, [limit]);

  return { products, loading, error };
};
