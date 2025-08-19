/**
 * Services - Modular API service layer
 * Components should never import these directly - use hooks instead
 */

export { ProductService } from './productService';
export { CartService } from './cartService';
export { UserService, type LoginCredentials, type LoginResponse } from './userService';
export { ImageService } from './imageService';
