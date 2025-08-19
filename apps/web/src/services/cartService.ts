/**
 * Cart Service - Handles all cart-related API calls
 */

import { Cart, CartItem } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class CartService {
  /**
   * Get all carts
   */
  static async getCarts(): Promise<Cart[]> {
    const response = await fetch(`${API_BASE}/carts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch carts: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get a single cart by ID
   */
  static async getCart(id: number): Promise<Cart> {
    const response = await fetch(`${API_BASE}/carts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cart: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get the user's most recent cart (don't merge, just use the latest one)
   */
  static async getUserCart(userId: number): Promise<Cart> {
    const userCarts = await this.getUserCarts(userId);
    
    if (userCarts.length === 0) {
      // Create new cart if none exists
      return this.createCart({
        userId,
        date: new Date().toISOString(),
        products: []
      });
    }
    
    // Sort by date to get the most recent cart
    const sortedCarts = userCarts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestCart = sortedCarts[0];
    
    return latestCart;
  }

  /**
   * Get carts for a specific user
   */
  static async getUserCarts(userId: number): Promise<Cart[]> {
    const response = await fetch(`${API_BASE}/carts/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user carts: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Create a new cart
   */
  static async createCart(cart: Omit<Cart, 'id'>): Promise<Cart> {
    const response = await fetch(`${API_BASE}/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cart),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create cart: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update an existing cart
   */
  static async updateCart(id: number, cart: Partial<Cart>): Promise<Cart> {
    const response = await fetch(`${API_BASE}/carts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cart),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update cart: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Delete a cart
   */
  static async deleteCart(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/carts/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete cart: ${response.statusText}`);
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(userId: number, productId: number, quantity: number): Promise<Cart> {
    // Get or create the user's single cart
    const cart = await this.getUserCart(userId);
    
    // Find existing item in cart
    const existingItem = cart.products.find(item => item.productId === productId);
    
    if (existingItem) {
      // Update quantity of existing item
      existingItem.quantity += quantity;
    } else {
      // Add new item to cart
      cart.products.push({
        productId,
        quantity
      });
    }
    
    // Update cart date
    cart.date = new Date().toISOString();
    
    // Update the cart in backend
    return this.updateCart(cart.id, cart);
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(userId: number, productId: number, quantity: number): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    
    const item = cart.products.find(item => item.productId === productId);
    
    if (!item) {
      throw new Error('Item not found in cart');
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.products = cart.products.filter(item => item.productId !== productId);
    } else {
      // Update quantity
      item.quantity = quantity;
    }
    
    // Update cart date
    cart.date = new Date().toISOString();
    
    return this.updateCart(cart.id, cart);
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: number, productId: number): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    
    // Remove the item from cart
    cart.products = cart.products.filter(item => item.productId !== productId);
    
    // Update cart date
    cart.date = new Date().toISOString();
    
    return this.updateCart(cart.id, cart);
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(userId: number): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    
    // Clear all products
    cart.products = [];
    
    // Update cart date
    cart.date = new Date().toISOString();
    
    return this.updateCart(cart.id, cart);
  }
}
