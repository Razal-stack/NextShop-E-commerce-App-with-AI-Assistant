/**
 * Simple Cart Hook - Just local cart operations, no save functionality
 */

import { useCallback } from 'react';
import { useCartStore } from '../lib/store';
import { useAuth } from './useAuth';
import { Product } from '../types';

export function useCart() {
  const { 
    items, 
    cartId, 
    addItem: addItemLocal, 
    removeItem: removeItemLocal, 
    updateQuantity: updateQuantityLocal,
    clearCart: clearCartLocal,
  } = useCartStore();
  
  const { isAuthenticated } = useAuth();

  // Add item to cart (local only)
  const addItem = useCallback(async (product: Product, quantity: number = 1): Promise<boolean> => {
    try {
      addItemLocal(product, quantity);
      return true;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      return false;
    }
  }, [addItemLocal]);

  // Remove item from cart (local only)
  const removeItem = useCallback(async (productId: number): Promise<boolean> => {
    try {
      removeItemLocal(productId);
      return true;
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      return false;
    }
  }, [removeItemLocal]);

  // Update item quantity (local only)
  const updateQuantity = useCallback(async (productId: number, quantity: number): Promise<boolean> => {
    try {
      updateQuantityLocal(productId, quantity);
      return true;
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      return false;
    }
  }, [updateQuantityLocal]);

  // Clear cart (local only)
  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      clearCartLocal();
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    }
  }, [clearCartLocal]);

  return {
    // Cart state
    items,
    cartId,
    isAuthenticated,
    
    // Cart operations (local only)
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Computed values
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    isEmpty: items.length === 0,
  };
}
