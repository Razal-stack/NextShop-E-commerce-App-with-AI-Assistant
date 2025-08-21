/**
 * Category controller for Express REST API
 */

import { Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  // Get all categories
  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.categoryService.getAllCategories();
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  };
}
