/**
 * Backend HTTP Service - Centralized HTTP client for backend services
 * Handles AI server communication with proper timeout and error handling
 */

export interface BackendHttpConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableLogs?: boolean;
}

export interface BackendHttpRequest extends BackendHttpConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  isAIRequest?: boolean;
}

class BackendHttpService {
  private config: BackendHttpConfig;

  constructor(config: BackendHttpConfig = {}) {
    this.config = {
      timeout: 30000, // 30 seconds default
      retries: 3,
      retryDelay: 1000,
      enableLogs: process.env.NODE_ENV === 'development',
      ...config
    };
  }

  /**
   * Create request with timeout and abort controller
   */
  private createRequestWithTimeout(
    url: string, 
    config: BackendHttpRequest
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = config.isAIRequest ? 180000 : (config.timeout || this.config.timeout!); // 3 minutes for AI requests
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Build fetch request
    const fetchOptions: RequestInit = {
      method: config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      signal: controller.signal
    };

    if (config.body && config.method !== 'GET') {
      fetchOptions.body = typeof config.body === 'string' 
        ? config.body 
        : JSON.stringify(config.body);
    }

    return fetch(url, fetchOptions)
      .then(response => {
        clearTimeout(timeoutId);
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        throw error;
      });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number,
    delay: number
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      // Don't retry on certain conditions
      if (retries <= 0 || 
          error.name === 'AbortError' || 
          (error.status && error.status >= 400 && error.status < 500)) {
        throw error;
      }

      if (this.config.enableLogs) {
        console.log(`[Backend HTTP] Retrying request in ${delay}ms. Retries left: ${retries}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      return this.retryRequest(requestFn, retries - 1, delay * 2);
    }
  }

  /**
   * Main request method
   */
  async request<T = any>(
    url: string, 
    config: BackendHttpRequest = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogs) {
        console.log(`[Backend HTTP] ${config.method || 'GET'} ${url}`, {
          isAIRequest: config.isAIRequest,
          timeout: config.isAIRequest ? '3 minutes' : `${config.timeout || this.config.timeout}ms`
        });
      }

      // Create request function for retries
      const makeRequest = async (): Promise<T> => {
        const response = await this.createRequestWithTimeout(url, config);
        
        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).status = response.status;
          (error as any).statusText = response.statusText;
          (error as any).responseText = errorText;
          throw error;
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return response.json();
        } else {
          return response.text() as T;
        }
      };

      // Execute with retry logic
      const result = await this.retryRequest(
        makeRequest,
        config.retries ?? this.config.retries!,
        config.retryDelay ?? this.config.retryDelay!
      );

      if (this.config.enableLogs) {
        const duration = Date.now() - startTime;
        console.log(`[Backend HTTP] Request completed in ${duration}ms`);
      }

      return result;

    } catch (error: any) {
      if (this.config.enableLogs) {
        const duration = Date.now() - startTime;
        console.error(`[Backend HTTP] Request failed after ${duration}ms:`, error);
      }

      // Enhanced error handling
      if (error.name === 'AbortError') {
        throw new Error('AI Server request timed out. The model might be loading. Please try again.');
      }

      if (error.message?.includes('fetch')) {
        throw new Error('Unable to connect to AI Server. Please check if the service is running.');
      }

      throw error;
    }
  }

  /**
   * Convenience methods
   */
  async get<T = any>(url: string, config: Omit<BackendHttpRequest, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(url: string, body?: any, config: Omit<BackendHttpRequest, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  /**
   * Special method for AI requests with extended timeout
   */
  async aiRequest<T = any>(url: string, body?: any, config: Omit<BackendHttpRequest, 'isAIRequest'> = {}): Promise<T> {
    return this.request<T>(url, { 
      ...config, 
      method: 'POST',
      body,
      isAIRequest: true 
    });
  }
}

// Create default instance for AI server communication
export const backendHttpService = new BackendHttpService({
  timeout: 180000, // 3 minutes for AI requests
  retries: 1, // Don't retry AI requests by default
  enableLogs: true
});

export default backendHttpService;
