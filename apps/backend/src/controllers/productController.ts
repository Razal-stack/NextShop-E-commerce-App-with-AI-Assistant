/**
 * Product controller for Express REST API
 */

import { Request, Response } from 'express';
import { ProductService } from '../services';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  // Get all products with optional filtering
  getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit, sort, category } = req.query;
      
      const result = await this.productService.getAllProducts({
        limit: limit ? Number(limit) : undefined,
        sort: sort as 'asc' | 'desc',
        category: category as string
      });
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  };

  // Get single product by ID
  getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const productId = Number(id);
      
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      const result = await this.productService.getProductById(productId);
      
      if (!result.success) {
        res.status(404).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  };

  // Get products by category
  getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category } = req.params;
      const { limit, sort } = req.query;
      
      const result = await this.productService.getProductsByCategory(category, {
        limit: limit ? Number(limit) : undefined,
        sort: sort as 'asc' | 'desc'
      });
      
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      
      res.json(result.data);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ error: 'Failed to fetch products by category' });
    }
  };

  // Get categories as Express route handler
  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.productService.getAllCategories();
      
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

  // Legacy MCP methods for backward compatibility
  async getProducts(filters: any = {}) {
    try {
      const result = await this.productService.getAllProducts(filters);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products'
      };
    }
  }

  async getProduct(id: number) {
    try {
      const result = await this.productService.getProductById(id);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to fetch product ${id}`
      };
    }
  }

  // Legacy MCP method for backward compatibility
  async getCategoriesLegacy() {
    try {
      const result = await this.productService.getAllCategories();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }
}
