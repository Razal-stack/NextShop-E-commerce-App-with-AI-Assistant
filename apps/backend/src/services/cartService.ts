import { FakeStoreAPI, Cart, CartItem } from './fakeStore';

export interface CartFilters {
  limit?: string;
  sort?: 'asc' | 'desc';
  startdate?: string;
  enddate?: string;
}

export class CartService {
  private fakeStoreAPI = new FakeStoreAPI();

  async addItemToCart(userId: number, productId: number, quantity: number): Promise<Cart> {
    try {
      const cart = await this.fakeStoreAPI.addToCart(userId, productId, quantity);
      return cart;
    } catch (error) {
      throw new Error(`Failed to add product ${productId} to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserCart(userId: number): Promise<Cart | null> {
    try {
      const cart = await this.fakeStoreAPI.getCart(userId);
      return cart;
    } catch (error) {
      // Return null if no cart exists, don't throw error
      return null;
    }
  }

  async getUserCartWithProductDetails(userId: number): Promise<any> {
    try {
      const cart = await this.getUserCart(userId);
      if (!cart || !cart.products || cart.products.length === 0) {
        return { products: [] };
      }

      // Fetch product details for each item in cart
      const productsWithDetails = await Promise.all(
        cart.products.map(async (item: CartItem) => {
          try {
            const product = await this.fakeStoreAPI.getProduct(item.productId);
            return {
              ...product,
              quantity: item.quantity
            };
          } catch (error) {
            // If we can't fetch product details, return basic info
            return {
              id: item.productId,
              title: `Product ${item.productId}`,
              price: 0,
              quantity: item.quantity,
              image: '/api/placeholder/64/64'
            };
          }
        })
      );

      return {
        ...cart,
        products: productsWithDetails
      };
    } catch (error) {
      return { products: [] };
    }
  }

  async getAllCarts(filters: CartFilters = {}): Promise<Cart[]> {
    try {
      // FakeStore API endpoint: GET /carts
      const carts = await this.fakeStoreAPI.getAllCarts(filters);
      return carts;
    } catch (error) {
      throw new Error('Failed to fetch all carts');
    }
  }

  async getUserCarts(userId: number): Promise<Cart[]> {
    try {
      // FakeStore API endpoint: GET /carts/user/:userId
      const carts = await this.fakeStoreAPI.getUserCarts(userId);
      return carts;
    } catch (error) {
      throw new Error(`Failed to fetch carts for user ${userId}`);
    }
  }

  async getCartById(cartId: number): Promise<Cart> {
    try {
      // FakeStore API endpoint: GET /carts/:id
      const cart = await this.fakeStoreAPI.getCartById(cartId);
      return cart;
    } catch (error) {
      throw new Error(`Failed to fetch cart ${cartId}`);
    }
  }

  async createCart(userId: number, date?: string, products: CartItem[] = []): Promise<Cart> {
    try {
      // FakeStore API endpoint: POST /carts
      const cart = await this.fakeStoreAPI.createCart(userId, date, products);
      return cart;
    } catch (error) {
      throw new Error('Failed to create cart');
    }
  }

  async updateCart(cartId: number, userId?: number, date?: string, products?: CartItem[]): Promise<Cart> {
    try {
      // FakeStore API endpoint: PUT /carts/:id
      const cart = await this.fakeStoreAPI.updateCartById(cartId, userId, date, products);
      return cart;
    } catch (error) {
      throw new Error(`Failed to update cart ${cartId}`);
    }
  }

  async deleteCart(cartId: number): Promise<{ id: number; message: string }> {
    try {
      // FakeStore API endpoint: DELETE /carts/:id
      const result = await this.fakeStoreAPI.deleteCart(cartId);
      return result;
    } catch (error) {
      throw new Error(`Failed to delete cart ${cartId}`);
    }
  }
}
