/**
 * Services barrel exports
 */

export { FakeStoreAPI } from './fakeStore';
export { ProductService } from './productService';
export { CartService } from './cartService';
export { UserService } from './userService';
export { AuthService } from './authService';
export { SessionManager } from './session';

// Re-export types from fakeStore for convenience
export type { Product, Cart, CartItem, User, LoginResult, ProductFilters } from './fakeStore';
export type { UserSession } from './session';
