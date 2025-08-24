/**
 * Authentication hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { UserService, type LoginCredentials } from '../services/userService';
import { CartService } from '../services/cartService';
import { ProductService } from '../services/productService';
import { type User } from '../types';
import { toast } from 'sonner';
import { useCartStore, useWishlistStore } from '../lib/store';

interface AuthUser extends User {
  // Add any additional auth-specific fields if needed
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: {
    firstname: string;
    lastname: string;
  };
  address: {
    city: string;
    street: string;
    number: number;
    zipcode: string;
    geolocation: {
      lat: string;
      long: string;
    };
  };
  phone: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0); // Force re-renders

  // Get store methods to clear cart and wishlist
  const { clearCart, loadCartFromData } = useCartStore();
  const { clearWishlist } = useWishlistStore();

  // Force component re-render
  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Clear any existing demo data on app start
        const shouldClearData = !localStorage.getItem('nextshop_production_mode');
        
        if (shouldClearData) {
          // Clear any old demo data but preserve existing auth
          const existingToken = localStorage.getItem('nextshop_token');
          const existingUser = localStorage.getItem('nextshop_user');
          
          localStorage.clear();
          localStorage.setItem('nextshop_production_mode', 'true');
          
          // Restore auth if it existed
          if (existingToken && existingUser) {
            localStorage.setItem('nextshop_token', existingToken);
            localStorage.setItem('nextshop_user', existingUser);
          }
          
          clearCart();
          clearWishlist();
        }
        
        const storedToken = localStorage.getItem('nextshop_token');
        const storedUser = localStorage.getItem('nextshop_user');
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Update local state
          setToken(storedToken);
          setUser(userData);
          
          // MOST IMPORTANT: Update UserStore as the primary source of truth
          const { useUserStore } = require('../lib/store');
          useUserStore.getState().setSession({
            token: storedToken,
            userId: userData.id,
            isAuthenticated: true,
            ...userData
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('nextshop_token');
        localStorage.removeItem('nextshop_user');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [clearCart, clearWishlist]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    if (isLoading) return false;
    
    setIsLoading(true);
    try {
      // Clear any existing cart and wishlist data
      clearCart();
      clearWishlist();
      
      const result = await UserService.login(credentials);
      
      if (!result.token) {
        toast.error('Invalid response from server');
        return false;
      }

      // Decode JWT token to get the real user ID (backend returns wrong userId)
      let realUserId: number;
      try {
        const tokenPayload = JSON.parse(atob(result.token.split('.')[1]));
        realUserId = tokenPayload.sub || result.userId;
      } catch (error) {
        console.error('Failed to decode token, using backend userId:', error);
        realUserId = result.userId;
      }

      // Fetch the full user data using the REAL userId from JWT token
      const userData = await UserService.getUser(realUserId);
      
      // Update UserStore for immediate UI updates
      const { useUserStore } = await import('../lib/store');
      const userStore = useUserStore.getState();
      userStore.setSession({
        token: result.token,
        userId: realUserId,
        isAuthenticated: true,
        ...userData
      });
      
      // Update local state as well for this hook
      setToken(result.token);
      setUser(userData);
      
      // Persist to localStorage
      localStorage.setItem('nextshop_token', result.token);
      localStorage.setItem('nextshop_user', JSON.stringify(userData));
      
      // Ensure isInitialized is true after successful login
      if (!isInitialized) {
        setIsInitialized(true);
      }
      
      // Force component re-renders
      forceUpdate();
      
      // Additional force update after a short delay
      setTimeout(() => {
        forceUpdate();
        // Trigger global state update
        window.dispatchEvent(new Event('auth-state-changed'));
      }, 50);
      
      // Show personalized welcome message with real user name
      const firstName = userData.name?.firstname || userData.username;
      const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      toast.success(`Welcome back, ${displayName}!`, {
        description: "Loading your cart and preferences...",
        duration: 3000
      });
      
      // Load user cart data from backend
      try {
        const userCart = await CartService.getUserCart(realUserId);
        
        // Check if cart has products
        if (!userCart.products || userCart.products.length === 0) {
          setTimeout(() => {
            toast.info("Your cart is empty", {
              description: "Start shopping to add items to your cart!",
              duration: 2000
            });
          }, 1000);
          return true;
        }
        
        // Fetch full product details for each cart item
        const cartItemsPromises = userCart.products.map(async (item, index) => {
          try {
            const product = await ProductService.getProduct(item.productId);
            return {
              id: product.id,
              title: product.title,
              price: product.price,
              image: product.image,
              quantity: item.quantity
            };
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId} (item ${index + 1}):`, error);
            // Return basic item if product fetch fails
            return {
              id: item.productId,
              title: `Product ${item.productId}`,
              price: 0,
              image: '',
              quantity: item.quantity
            };
          }
        });
        
        const cartItems = await Promise.all(cartItemsPromises);
        
        // Filter out any failed items (with price 0 and default title)
        const validCartItems = cartItems.filter(item => item.price > 0 || !item.title.startsWith('Product '));
        const failedItems = cartItems.length - validCartItems.length;
        
        if (validCartItems.length > 0) {
          loadCartFromData(validCartItems, userCart.id);
          
          // Show cart loaded confirmation
          const totalItems = validCartItems.reduce((sum, item) => sum + item.quantity, 0);
          setTimeout(() => {
            let message = `Cart loaded! ${totalItems} items restored`;
            let description = `Found ${validCartItems.length} different products in your cart (Cart ID: ${userCart.id})`;
            
            if (failedItems > 0) {
              description += ` (${failedItems} items could not be loaded)`;
            }
            
            toast.success(message, {
              description,
              duration: 3000
            });
          }, 1000);
        } else {
          setTimeout(() => {
            toast.warning("Cart could not be loaded", {
              description: "Some items in your cart may no longer be available",
              duration: 3000
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to load user cart:', error);
        // Don't fail login if cart loading fails
      }
      
      // Login completed successfully - no page refresh needed!
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, clearCart, clearWishlist, loadCartFromData, forceUpdate]);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    if (isLoading) return false;
    
    setIsLoading(true);
    try {
      const newUser = await UserService.createUser(userData);
      
      if (!newUser) {
        toast.error('Registration failed');
        return false;
      }

      // Don't auto-login after registration - require manual sign-in
      toast.success('Account created successfully! Please sign in to continue.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const logout = useCallback(() => {
    // Clear local state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('nextshop_token');
    localStorage.removeItem('nextshop_user');
    
    // Update UserStore - primary source of truth
    const { useUserStore } = require('../lib/store');
    useUserStore.getState().clearSession();
    
    // Clear cart and wishlist
    clearCart();
    clearWishlist();
    
    toast.success('Logged out successfully');
  }, [clearCart, clearWishlist]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!user || isLoading) return false;
    
    setIsLoading(true);
    try {
      await UserService.deleteUser(user.id);
      logout();
      toast.success('Account deleted successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, logout]);

  const updateUser = useCallback(async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user || isLoading) return false;
    
    setIsLoading(true);
    try {
      const updatedUser = await UserService.updateUser(user.id, userData);
      
      if (updatedUser) {
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        localStorage.setItem('nextshop_user', JSON.stringify(newUser));
        toast.success('Profile updated successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading]);

  const isAuthenticated = Boolean(user && token);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    register,
    logout,
    deleteAccount,
    updateUser,
  };
}
