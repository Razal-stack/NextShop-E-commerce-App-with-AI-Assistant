/**
 * Type definitions for the web application
 */

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface Cart {
  id: number;
  userId: number;
  date: string;
  products: CartItem[];
}

export interface User {
  id: number;
  email: string;
  username: string;
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

export interface ProductFilters {
  category?: string;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export interface WishlistItem {
  productId: number;
  addedAt: string;
}

export interface AppState {
  user: User | null;
  cart: Cart;
  wishlist: WishlistItem[];
  isAIAssistantOpen: boolean;
}
