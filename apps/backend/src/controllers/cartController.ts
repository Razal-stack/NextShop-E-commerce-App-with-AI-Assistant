import { Request, Response } from 'express';
import { CartService } from '../services';

export class CartController {
  private cartService = new CartService();

  /**
   * GET /carts - Get all carts
   */
  getAllCarts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit, sort, startdate, enddate } = req.query;
      
      const carts = await this.cartService.getAllCarts({
        limit: limit as string,
        sort: sort as 'asc' | 'desc',
        startdate: startdate as string,
        enddate: enddate as string
      });
      
      res.status(200).json(carts);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch carts' 
      });
    }
  };

  /**
   * GET /carts/user/:userId - Get carts for specific user
   */
  getUserCarts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const carts = await this.cartService.getUserCarts(parseInt(userId));
      
      res.status(200).json(carts);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user carts' 
      });
    }
  };

  /**
   * GET /carts/:id - Get single cart by ID
   */
  getCartById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const cart = await this.cartService.getCartById(parseInt(id));
      
      res.status(200).json(cart);
    } catch (error) {
      res.status(404).json({ 
        error: error instanceof Error ? error.message : 'Cart not found' 
      });
    }
  };

  /**
   * POST /carts - Create new cart
   */
  createCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, date, products } = req.body;
      
      const cart = await this.cartService.createCart(userId, date, products);
      
      res.status(201).json(cart);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to create cart' 
      });
    }
  };

  /**
   * PUT /carts/:id - Update cart
   */
  updateCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, date, products } = req.body;
      
      const cart = await this.cartService.updateCart(parseInt(id), userId, date, products);
      
      res.status(200).json(cart);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to update cart' 
      });
    }
  };

  /**
   * DELETE /carts/:id - Delete cart
   */
  deleteCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const result = await this.cartService.deleteCart(parseInt(id));
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete cart' 
      });
    }
  };
}
