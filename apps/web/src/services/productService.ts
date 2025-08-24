/**
 * Product Service - Handles all product-related API calls
 */

import { Product, ProductFilters } from '../types';
import httpService from './httpService';

export class ProductService {
  /**
   * Get all products with optional filters
   */
  static async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const params = new URLSearchParams();
    
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort) params.append('sort', filters.sort);
    if (filters?.category) params.append('category', filters.category);

    const endpoint = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await httpService.get<Product[]>(endpoint);
    return response.data;
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(id: number): Promise<Product> {
    const response = await httpService.get<Product>(`/products/${id}`);
    return response.data;
  }

  /**
   * Get all product categories
   */
  static async getCategories(): Promise<string[]> {
    const response = await httpService.get<string[]>('/products/categories');
    return response.data;
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
    
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    // If it's already a backend URL, return as is
    if (originalUrl.startsWith(apiBase)) {
      return originalUrl;
    }
    
    // Convert external image URL to backend proxy
    return `${apiBase}/images/proxy?url=${encodeURIComponent(originalUrl)}`;
  }
}
