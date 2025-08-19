/**
 * Backend API service - Frontend only knows about our backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types (should match backend types)
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class BackendApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Product endpoints
  async getProducts(params?: {
    limit?: number;
    sort?: 'asc' | 'desc';
    category?: string;
  }): Promise<Product[]> {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    
    return this.request<Product[]>(`/products${queryString}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async getProductsByCategory(category: string, params?: {
    limit?: number;
    sort?: 'asc' | 'desc';
  }): Promise<Product[]> {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : '';
    
    return this.request<Product[]>(`/products/category/${category}${queryString}`);
  }

  async getCategories(): Promise<string[]> {
    return this.request<string[]>('/products/categories');
  }

  // Cart endpoints
  async getCart(userId: number): Promise<Cart> {
    return this.request<Cart>(`/cart/${userId}`);
  }

  async addToCart(userId: number, productId: number, quantity: number = 1): Promise<Cart> {
    return this.request<Cart>(`/cart/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(userId: number, productId: number, quantity: number): Promise<Cart> {
    return this.request<Cart>(`/cart/${userId}/update`, {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async removeFromCart(userId: number, productId: number): Promise<Cart> {
    return this.request<Cart>(`/cart/${userId}/remove/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(userId: number): Promise<Cart> {
    return this.request<Cart>(`/cart/${userId}/clear`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUsers(limit?: number): Promise<User[]> {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request<User[]>(`/users${queryString}`);
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async login(username: string, password: string): Promise<{ token: string; userId: number }> {
    return this.request<{ token: string; userId: number }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Image proxy - convert external image URLs to backend proxy URLs
  getImageUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    
    // If it's already a backend URL, return as is
    if (originalUrl.startsWith(API_BASE_URL)) {
      return originalUrl;
    }
    
    // Convert FakeStore image URLs to backend proxy URLs
    if (originalUrl.startsWith('https://fakestoreapi.com/img/')) {
      return `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    }
    
    // For other URLs, return as is (could be enhanced with more proxy logic)
    return originalUrl;
  }
}

// Export singleton instance
export const backendApi = new BackendApiService();
export default backendApi;
