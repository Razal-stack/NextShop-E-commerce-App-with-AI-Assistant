/**
 * Product service for FakeStore API integration
 */

import { FakeStoreAPI } from './fakeStore';
import { ProductFilters } from '../types';

export class ProductService {
  private fakeStoreAPI: FakeStoreAPI;

  constructor() {
    this.fakeStoreAPI = new FakeStoreAPI();
  }

  async getAllProducts(filters: ProductFilters = {}) {
    try {
      const products = await this.fakeStoreAPI.getProducts(filters);
      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      };
    }
  }

  async getProductById(id: number) {
    try {
      const product = await this.fakeStoreAPI.getProduct(id);
      return {
        success: true,
        data: product
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch product ${id}`
      };
    }
  }

  async getProductsByCategory(category: string, filters: Omit<ProductFilters, 'category'> = {}) {
    try {
      const products = await this.fakeStoreAPI.getProducts({ ...filters, category });
      return {
        success: true,
        data: products
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch products for category ${category}`
      };
    }
  }

  async getAllCategories() {
    try {
      const categories = await this.fakeStoreAPI.getCategories();
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }
}
