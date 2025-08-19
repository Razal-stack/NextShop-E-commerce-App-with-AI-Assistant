/**
 * Image Service - Handles all image-related operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ImageService {
  /**
   * Convert any external image URL to use backend proxy
   * This ensures all images go through our backend for consistency and security
   */
  static getProxiedImageUrl(originalUrl: string): string {
    if (!originalUrl) return '';
    
    // If it's already a backend URL, return as is
    if (originalUrl.startsWith(API_BASE)) {
      return originalUrl;
    }
    
    // Convert external image URL to backend proxy
    return `${API_BASE}/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  }

  /**
   * Get optimized image URL with optional parameters
   */
  static getOptimizedImageUrl(originalUrl: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): string {
    const proxiedUrl = this.getProxiedImageUrl(originalUrl);
    
    if (!options) return proxiedUrl;
    
    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    
    const paramString = params.toString();
    return paramString ? `${proxiedUrl}&${paramString}` : proxiedUrl;
  }

  /**
   * Preload an image for better performance
   */
  static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = this.getProxiedImageUrl(url);
    });
  }
}
