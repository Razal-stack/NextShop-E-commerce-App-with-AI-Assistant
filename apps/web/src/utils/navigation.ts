/**
 * Navigation helper utilities for tracking user navigation context and product filtering
 */

export interface NavigationContext {
  from: string;
  label: string;
  timestamp: number;
}

export interface ProductFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  sort?: string;
  search?: string;
  type?: 'featured' | 'budget' | 'top-rated' | 'category';
}

export interface FilteredNavigationOptions {
  filters?: ProductFilters;
  showFilters?: boolean;
  title?: string;
  description?: string;
}

const NAVIGATION_KEY = 'nextshop_navigation_context';

export class NavigationHelper {
  /**
   * Navigate to products page with specific filters applied
   */
  static navigateToProductsWithFilters(router: any, options: FilteredNavigationOptions = {}) {
    const { filters = {}, showFilters = true, title, description } = options;
    
    // Build query parameters from filters
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.priceMin !== undefined) queryParams.set('priceMin', filters.priceMin.toString());
    if (filters.priceMax !== undefined) queryParams.set('priceMax', filters.priceMax.toString());
    if (filters.rating !== undefined) queryParams.set('rating', filters.rating.toString());
    if (filters.sort) queryParams.set('sort', filters.sort);
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.type) queryParams.set('type', filters.type);
    if (showFilters) queryParams.set('showFilters', 'true');
    if (title) queryParams.set('title', title);
    if (description) queryParams.set('description', description);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    
    router.push(url);
  }

  /**
   * Parse URL parameters to extract filter state
   */
  static parseFiltersFromURL(searchParams: URLSearchParams): {
    filters: ProductFilters;
    showFilters: boolean;
    title?: string;
    description?: string;
  } {
    const filters: ProductFilters = {};
    
    const category = searchParams.get('category');
    if (category) filters.category = decodeURIComponent(category);
    
    const priceMin = searchParams.get('priceMin');
    if (priceMin) filters.priceMin = parseFloat(priceMin);
    
    const priceMax = searchParams.get('priceMax');
    if (priceMax) filters.priceMax = parseFloat(priceMax);
    
    const rating = searchParams.get('rating');
    if (rating) filters.rating = parseFloat(rating);
    
    const sort = searchParams.get('sort');
    if (sort) filters.sort = sort;
    
    const search = searchParams.get('search');
    if (search) filters.search = decodeURIComponent(search);
    
    const type = searchParams.get('type') as ProductFilters['type'];
    if (type) filters.type = type;
    
    const showFilters = searchParams.get('showFilters') === 'true';
    const title = searchParams.get('title');
    const description = searchParams.get('description');
    
    return {
      filters,
      showFilters,
      title: title ? decodeURIComponent(title) : undefined,
      description: description ? decodeURIComponent(description) : undefined
    };
  }

  /**
   * Get filter configurations for different widget types
   */
  static getWidgetFilterConfig(widgetType: string): FilteredNavigationOptions {
    switch (widgetType) {
      case 'budget':
        return {
          filters: {
            priceMax: 25,
            sort: 'price-low',
            type: 'budget'
          },
          showFilters: true
        };
      
      case 'featured':
        return {
          filters: {
            sort: 'rating',
            type: 'featured'
          },
          showFilters: true
        };
      
      case 'top-rated':
        return {
          filters: {
            sort: 'rating',
            type: 'top-rated'
          },
          showFilters: true
        };
      
      default:
        return { showFilters: true };
    }
  }
  /**
   * Set navigation context when navigating to a product
   */
  static setProductNavigationContext(fromPath: string, fromLabel: string) {
    if (typeof window === 'undefined') return;
    
    const context: NavigationContext = {
      from: fromPath,
      label: fromLabel,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(NAVIGATION_KEY, JSON.stringify(context));
  }

  /**
   * Get the navigation context for back navigation
   */
  static getNavigationContext(): NavigationContext | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem(NAVIGATION_KEY);
      if (!stored) return null;
      
      const context: NavigationContext = JSON.parse(stored);
      
      // Context expires after 30 minutes
      if (Date.now() - context.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(NAVIGATION_KEY);
        return null;
      }
      
      return context;
    } catch {
      return null;
    }
  }

  /**
   * Clear navigation context
   */
  static clearNavigationContext() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(NAVIGATION_KEY);
  }

  /**
   * Get smart back navigation info based on referrer and stored context
   */
  static getBackNavigation(): { path: string; label: string; useHistory: boolean } {
    // First try stored context
    const context = this.getNavigationContext();
    if (context) {
      return {
        path: context.from,
        label: context.label,
        useHistory: false
      };
    }

    // Fall back to referrer analysis
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;
      
      if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerPath = referrer.replace(currentOrigin, '');
        
        if (referrerPath === '/' || referrerPath === '') {
          return { path: '/', label: 'Back to Home', useHistory: false };
        } else if (referrerPath.startsWith('/products')) {
          return { path: '/products', label: 'Back to Products', useHistory: false };
        } else {
          return { path: '', label: 'Back', useHistory: true };
        }
      }
    }

    // Default fallback
    return { path: '/products', label: 'Back to Products', useHistory: false };
  }
}
