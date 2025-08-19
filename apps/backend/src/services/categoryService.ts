/**
 * Category service for FakeStore API integration
 */

import { FakeStoreAPI } from './fakeStore';

export class CategoryService {
  private fakeStoreAPI: FakeStoreAPI;

  constructor() {
    this.fakeStoreAPI = new FakeStoreAPI();
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
