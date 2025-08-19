/**
 * Product Service - Handles all product-related API calls
 */

import { Product, ProductFilters } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ProductService {
  /**
   * Get all products with optional filters
   */
  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();
    
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.category) params.append('category', filters.category);

    const url = `${API_BASE}/products${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get all product categories
   */
  static async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/products/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string): Promise<Product[]> {
    return this.getProducts({ category });
  }

  /**
   * Convert image URL to use backend proxy
   */
  static getImageUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    
    // If it's already a backend URL, return as is
    if (originalUrl.startsWith(API_BASE)) {
      return originalUrl;
    }
    
    // Convert external image URL to backend proxy
    return `${API_BASE}/images/proxy?url=${encodeURIComponent(originalUrl)}`;
  }
}
