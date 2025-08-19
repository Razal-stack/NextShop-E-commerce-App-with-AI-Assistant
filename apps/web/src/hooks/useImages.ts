/**
 * Image-related hooks
 */

import { ImageService } from '../services/imageService';

export function useImages() {
  /**
   * Get proxied image URL through backend
   */
  const getProxiedImageUrl = (originalUrl: string): string => {
    return ImageService.getProxiedImageUrl(originalUrl);
  };

  /**
   * Get optimized image URL with optional parameters
   */
  const getOptimizedImageUrl = (
    originalUrl: string, 
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): string => {
    return ImageService.getOptimizedImageUrl(originalUrl, options);
  };

  /**
   * Preload an image for better performance
   */
  const preloadImage = (url: string): Promise<void> => {
    return ImageService.preloadImage(url);
  };

  return {
    getProxiedImageUrl,
    getOptimizedImageUrl,
    preloadImage,
  };
}
