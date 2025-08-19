import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ProductService } from '@/services/productService';

export const useFeaturedProducts = (limit: number = 4) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get featured products - could be based on rating, popularity, or random selection
        // For now, we'll get products with high ratings and good review counts
        const allProducts = await ProductService.getProducts();
        const featured = allProducts
          .filter((product: Product) => product.rating.rate >= 3.5 && product.rating.count >= 50) // High rating with good review count
          .sort((a: Product, b: Product) => {
            // Sort by a combination of rating and review count
            const scoreA = a.rating.rate * Math.log(a.rating.count + 1);
            const scoreB = b.rating.rate * Math.log(b.rating.count + 1);
            return scoreB - scoreA;
          })
          .slice(0, limit);
        
        // If we don't have enough highly-rated products, fall back to first products
        if (featured.length < limit) {
          const fallback = allProducts.slice(0, limit);
          setProducts(fallback);
        } else {
          setProducts(featured);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [limit]);

  return { products, loading, error };
};
