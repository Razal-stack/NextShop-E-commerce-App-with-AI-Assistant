import axios from 'axios';

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

export interface LoginResult {
  token: string;
  userId: number;
}

export interface ProductFilters {
  category?: string;
  limit?: number;
  sort?: 'asc' | 'desc';
}

export class FakeStoreAPI {
  private baseURL = 'https://fakestoreapi.com';

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username,
        password
      });
      
      return {
        token: response.data.token,
        userId: 1 // FakeStore doesn't return userId, so we use a default
      };
    } catch (error) {
      throw new Error('Login failed: Invalid credentials');
    }
  }

  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    try {
      let url = `${this.baseURL}/products`;
      const params = new URLSearchParams();

      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.sort) {
        params.append('sort', filters.sort);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get<Product[]>(url);
      let products = response.data;

      // Filter by category if specified
      if (filters.category) {
        products = products.filter(p => p.category === filters.category);
      }

      return products;
    } catch (error) {
      throw new Error('Failed to fetch products');
    }
  }

  async getProduct(id: number): Promise<Product> {
    try {
      const response = await axios.get<Product>(`${this.baseURL}/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch product ${id}`);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(`${this.baseURL}/products/categories`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  async getCart(userId: number): Promise<Cart> {
    try {
      // FakeStore API limitation: we'll simulate user cart
      const response = await axios.get<Cart[]>(`${this.baseURL}/carts/user/${userId}`);
      
      if (response.data.length > 0) {
        return response.data[0];
      }

      // Return empty cart if none exists
      return {
        id: Date.now(),
        userId,
        date: new Date().toISOString(),
        products: []
      };
    } catch (error) {
      // Return empty cart on error
      return {
        id: Date.now(),
        userId,
        date: new Date().toISOString(),
        products: []
      };
    }
  }

  async addToCart(userId: number, productId: number, quantity: number): Promise<Cart> {
    try {
      // FakeStore limitation: we simulate cart operations
      const currentCart = await this.getCart(userId);
      const existingItem = currentCart.products.find(p => p.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        currentCart.products.push({ productId, quantity });
      }

      // Simulate API call
      const response = await axios.post(`${this.baseURL}/carts`, {
        userId,
        date: new Date().toISOString(),
        products: currentCart.products
      });

      return {
        ...currentCart,
        id: response.data.id || currentCart.id
      };
    } catch (error) {
      throw new Error('Failed to add product to cart');
    }
  }

  async updateCartItem(userId: number, productId: number, quantity: number): Promise<Cart> {
    try {
      const currentCart = await this.getCart(userId);
      
      if (quantity === 0) {
        currentCart.products = currentCart.products.filter(p => p.productId !== productId);
      } else {
        const existingItem = currentCart.products.find(p => p.productId === productId);
        if (existingItem) {
          existingItem.quantity = quantity;
        } else {
          currentCart.products.push({ productId, quantity });
        }
      }

      // Simulate API call
      await axios.put(`${this.baseURL}/carts/${currentCart.id}`, {
        userId,
        date: new Date().toISOString(),
        products: currentCart.products
      });

      return currentCart;
    } catch (error) {
      throw new Error('Failed to update cart');
    }
  }

  async removeFromCart(userId: number, productId: number): Promise<Cart> {
    return this.updateCartItem(userId, productId, 0);
  }

  async clearCart(userId: number): Promise<Cart> {
    try {
      const currentCart = await this.getCart(userId);
      currentCart.products = [];

      // Simulate API call
      await axios.put(`${this.baseURL}/carts/${currentCart.id}`, {
        userId,
        date: new Date().toISOString(),
        products: []
      });

      return currentCart;
    } catch (error) {
      throw new Error('Failed to clear cart');
    }
  }
}
