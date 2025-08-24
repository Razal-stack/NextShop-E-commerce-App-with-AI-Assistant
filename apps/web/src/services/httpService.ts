/**
 * HTTP Service - Centralized HTTP client with timeout, error handling, and interceptors
 * Handles all HTTP calls across the application with consistent behavior
 */

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  enableLogs?: boolean;
}

export interface HttpRequestConfig extends HttpConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  signal?: AbortSignal;
  isAIRequest?: boolean; // Special handling for AI requests with longer timeouts
  showProgress?: boolean; // Show progress for long-running requests
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface HttpError {
  message: string;
  status?: number;
  statusText?: string;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  originalError?: Error;
}

export type RequestInterceptor = (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
export type ErrorInterceptor = (error: HttpError) => HttpError | Promise<HttpError>;

export type ProgressCallback = (info: { 
  stage: 'connecting' | 'processing' | 'completing';
  timeElapsed: number;
  message: string;
}) => void;

class HttpService {
  private config: HttpConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000, // 30 seconds default
      retries: 3,
      retryDelay: 1000,
      enableLogs: process.env.NODE_ENV === 'development',
      ...config
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Create request with timeout and abort controller
   */
  private createRequestWithTimeout(
    url: string, 
    config: HttpRequestConfig, 
    progressCallback?: ProgressCallback
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = config.isAIRequest ? 240000 : (config.timeout || this.config.timeout!); // 4 minutes for AI requests
    
    // Progress tracking for long requests
    let progressTimer: NodeJS.Timeout;
    let startTime = Date.now();
    
    if (progressCallback && (config.isAIRequest || timeoutMs > 30000)) {
      progressCallback({
        stage: 'connecting',
        timeElapsed: 0,
        message: 'Connecting to server...'
      });

      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed < 30000) {
          progressCallback({
            stage: 'connecting',
            timeElapsed: elapsed,
            message: 'Establishing connection...'
          });
        } else if (elapsed < 60000) {
          progressCallback({
            stage: 'processing',
            timeElapsed: elapsed,
            message: config.isAIRequest ? 'AI model is loading...' : 'Processing your request...'
          });
        } else if (elapsed < 120000) {
          progressCallback({
            stage: 'processing',
            timeElapsed: elapsed,
            message: config.isAIRequest ? 'AI is analyzing your request...' : 'Complex processing in progress...'
          });
        } else {
          progressCallback({
            stage: 'completing',
            timeElapsed: elapsed,
            message: 'Almost done...'
          });
        }
      }, 1000);
    }

    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (progressTimer) clearInterval(progressTimer);
      controller.abort();
    }, timeoutMs);

    // Build fetch request
    const fetchOptions: RequestInit = {
      method: config.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...config.headers
      },
      signal: config.signal || controller.signal
    };

    if (config.body && config.method !== 'GET') {
      fetchOptions.body = typeof config.body === 'string' 
        ? config.body 
        : JSON.stringify(config.body);
    }

    const fetchPromise = fetch(url, fetchOptions)
      .then(response => {
        clearTimeout(timeoutId);
        if (progressTimer) {
          clearInterval(progressTimer);
          if (progressCallback) {
            progressCallback({
              stage: 'completing',
              timeElapsed: Date.now() - startTime,
              message: 'Request completed!'
            });
          }
        }
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (progressTimer) clearInterval(progressTimer);
        throw error;
      });

    return fetchPromise;
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: HttpRequestConfig): Promise<HttpRequestConfig> {
    let processedConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let processedResponse = { ...response };
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: HttpError): Promise<HttpError> {
    let processedError = { ...error };
    
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError);
    }
    
    return processedError;
  }

  /**
   * Create proper error object
   */
  private createError(error: any, response?: Response): HttpError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout - The server is taking longer than expected. Please try again.',
        isTimeout: true,
        originalError: error
      };
    }

    if (error.message?.includes('fetch')) {
      return {
        message: 'Network error - Unable to connect to the server. Please check your internet connection.',
        isNetworkError: true,
        originalError: error
      };
    }

    if (response) {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        statusText: response.statusText,
        originalError: error
      };
    }

    return {
      message: error.message || 'An unknown error occurred',
      originalError: error
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<HttpResponse<T>>,
    retries: number,
    delay: number
  ): Promise<HttpResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      const httpError = error as HttpError;
      
      // Don't retry on certain conditions
      if (retries <= 0 || 
          httpError.isTimeout || 
          (httpError.status && httpError.status >= 400 && httpError.status < 500)) {
        throw error;
      }

      if (this.config.enableLogs) {
        console.log(`[HTTP Service] Retrying request in ${delay}ms. Retries left: ${retries}`);
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
    endpoint: string, 
    config: HttpRequestConfig = {},
    progressCallback?: ProgressCallback
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    
    try {
      // Apply request interceptors
      const processedConfig = await this.applyRequestInterceptors(config);
      
      // Build full URL
      const baseURL = processedConfig.baseURL || this.config.baseURL!;
      const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
      
      if (this.config.enableLogs) {
        console.log(`[HTTP Service] ${processedConfig.method || 'GET'} ${url}`, {
          isAIRequest: processedConfig.isAIRequest,
          timeout: processedConfig.isAIRequest ? '4 minutes' : `${processedConfig.timeout || this.config.timeout}ms`
        });
      }

      // Create request function for retries
      const makeRequest = async (): Promise<HttpResponse<T>> => {
        const response = await this.createRequestWithTimeout(url, processedConfig, progressCallback);
        
        if (!response.ok) {
          const error = this.createError(new Error(`HTTP ${response.status}`), response);
          throw await this.applyErrorInterceptors(error);
        }

        const data = response.headers.get('content-type')?.includes('application/json')
          ? await response.json()
          : await response.text();

        const httpResponse: HttpResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };

        return this.applyResponseInterceptors(httpResponse);
      };

      // Execute with retry logic
      const result = await this.retryRequest(
        makeRequest,
        processedConfig.retries ?? this.config.retries!,
        processedConfig.retryDelay ?? this.config.retryDelay!
      );

      if (this.config.enableLogs) {
        const duration = Date.now() - startTime;
        console.log(`[HTTP Service] Request completed in ${duration}ms`);
      }

      return result;

    } catch (error) {
      if (this.config.enableLogs) {
        const duration = Date.now() - startTime;
        console.error(`[HTTP Service] Request failed after ${duration}ms:`, error);
      }

      const httpError = error instanceof Error ? this.createError(error) : error as HttpError;
      throw await this.applyErrorInterceptors(httpError);
    }
  }

  /**
   * Convenience methods
   */
  async get<T = any>(endpoint: string, config: Omit<HttpRequestConfig, 'method'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, config: Omit<HttpRequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, config: Omit<HttpRequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, config: Omit<HttpRequestConfig, 'method'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, config: Omit<HttpRequestConfig, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * Special method for AI requests with extended timeout
   */
  async aiRequest<T = any>(
    endpoint: string, 
    body?: any, 
    config: Omit<HttpRequestConfig, 'isAIRequest'> = {},
    progressCallback?: ProgressCallback
  ): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { 
      ...config, 
      method: 'POST',
      body,
      isAIRequest: true 
    }, progressCallback);
  }
}

// Create default instances
export const httpService = new HttpService();

// AI-specific instance with longer timeouts
export const aiHttpService = new HttpService({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  timeout: 240000, // 4 minutes
  retries: 1, // Don't retry AI requests
  enableLogs: true
});

// Add common interceptors
httpService.addRequestInterceptor((config) => {
  // Add auth token if available
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;
  
  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  
  return config;
});

httpService.addErrorInterceptor((error) => {
  // Enhanced error messages
  if (error.isTimeout) {
    error.message = 'Request timed out. The server is taking longer than expected. Please try again.';
  } else if (error.isNetworkError) {
    error.message = 'Network error. Please check your internet connection and try again.';
  } else if (error.status === 401) {
    error.message = 'Authentication failed. Please log in and try again.';
  } else if (error.status === 403) {
    error.message = 'Access denied. You don\'t have permission to perform this action.';
  } else if (error.status === 404) {
    error.message = 'Resource not found. The requested item may no longer exist.';
  } else if (error.status === 500) {
    error.message = 'Server error. Please try again later or contact support.';
  }
  
  return error;
});

export default httpService;
