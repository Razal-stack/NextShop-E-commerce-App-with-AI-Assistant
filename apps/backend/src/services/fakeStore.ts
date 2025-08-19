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

  async loginUser(username: string, password: string): Promise<LoginResult> {
    return this.login(username, password);
  }

  async getUsers(limit?: number): Promise<User[]> {
    try {
      let url = `${this.baseURL}/users`;
      if (limit) {
        url += `?limit=${limit}`;
      }
      
      const response = await axios.get<User[]>(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  }

  async getUser(id: number): Promise<User> {
    try {
      const response = await axios.get<User>(`${this.baseURL}/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user ${id}`);
    }
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      // First authenticate with FakeStore API
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username,
        password
      });
      
      // If authentication successful, find the user to get their real ID
      const users = await this.getUsers();
      const user = users.find(u => u.username === username);
      
      if (!user) {
        throw new Error('User not found after successful authentication');
      }
      
      return {
        token: response.data.token,
        userId: user.id // Return the actual user ID
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('User not found')) {
        throw error;
      }
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

  // FakeStore-compliant cart methods
  async getAllCarts(filters: { limit?: string; sort?: 'asc' | 'desc'; startdate?: string; enddate?: string } = {}): Promise<Cart[]> {
    try {
      let url = `${this.baseURL}/carts`;
      const params = new URLSearchParams();

      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.startdate) params.append('startdate', filters.startdate);
      if (filters.enddate) params.append('enddate', filters.enddate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get<Cart[]>(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch all carts');
    }
  }

  async getUserCarts(userId: number): Promise<Cart[]> {
    try {
      const response = await axios.get<Cart[]>(`${this.baseURL}/carts/user/${userId}`);
      return response.data;
    } catch (error) {
      // Return empty array if no carts found
      return [];
    }
  }

  async getCartById(cartId: number): Promise<Cart> {
    try {
      const response = await axios.get<Cart>(`${this.baseURL}/carts/${cartId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch cart ${cartId}`);
    }
  }

  async createCart(userId: number, date?: string, products: CartItem[] = []): Promise<Cart> {
    try {
      const response = await axios.post<Cart>(`${this.baseURL}/carts`, {
        userId,
        date: date || new Date().toISOString(),
        products
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create cart');
    }
  }

  async updateCartById(cartId: number, userId?: number, date?: string, products?: CartItem[]): Promise<Cart> {
    try {
      const updateData: any = {};
      if (userId !== undefined) updateData.userId = userId;
      if (date !== undefined) updateData.date = date;
      if (products !== undefined) updateData.products = products;

      const response = await axios.put<Cart>(`${this.baseURL}/carts/${cartId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update cart ${cartId}`);
    }
  }

  async deleteCart(cartId: number): Promise<{ id: number; message: string }> {
    try {
      await axios.delete(`${this.baseURL}/carts/${cartId}`);
      return {
        id: cartId,
        message: 'Cart deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete cart ${cartId}`);
    }
  }

  // User CRUD methods (FakeStore standard)
  async createUser(userData: any): Promise<User> {
    try {
      const response = await axios.post<User>(`${this.baseURL}/users`, userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: number, userData: any): Promise<User> {
    try {
      const response = await axios.put<User>(`${this.baseURL}/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user ${id}`);
    }
  }

  async deleteUser(id: number): Promise<{ id: number; message: string }> {
    try {
      await axios.delete(`${this.baseURL}/users/${id}`);
      return {
        id,
        message: 'User deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete user ${id}`);
    }
  }
}
