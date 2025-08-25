/**
 * MCP (Model Context Protocol) Service
 * Handles all AI-related communication using the centralized HTTP service
 */

import { aiHttpService, httpService, ProgressCallback } from './httpService';

export interface NexResponse {
  message: string;
  displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
  data?: {
    products?: any[];
    totalFound?: number;
    cart?: any;
    uiActions?: {
      instructions: string[];
      handlers: string[];
    };
  };
  actions?: {
    type: 'navigate' | 'filter_products' | 'add_to_cart' | 'add_to_wishlist';
    payload: any;
  }[];
}

export interface AIResponse {
  success: boolean;
  result?: NexResponse;
  error?: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface McpClient {
  sendMessage(
    messages: ConversationMessage[], 
    overrideQuery?: string,
    progressCallback?: ProgressCallback
  ): Promise<NexResponse>;
  sendImageQuery(query: string, base64String: string, progressCallback?: ProgressCallback): Promise<NexResponse>;
  sendImage?(base64String: string): Promise<{ caption: string }>;
}

class McpService implements McpClient {
  /**
   * Send message to AI service
   */
  async sendMessage(
    messages: ConversationMessage[], 
    overrideQuery?: string,
    progressCallback?: ProgressCallback
  ): Promise<NexResponse> {
    try {
      // Convert messages to a single query string (take last user message or use overrideQuery)
      let query = overrideQuery;
      if (!query && messages && messages.length > 0) {
        const userMessages = messages.filter(m => m.role === 'user');
        query = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
      }
      if (!query) query = '';

      // Convert messages to conversation history format for backend
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use aiHttpService for AI requests with progress callback
      const response = await aiHttpService.aiRequest<AIResponse>(
        '/api/ai/query',
        { 
          query, 
          userId: 1, 
          conversationHistory 
        },
        {}, // Additional config if needed
        progressCallback
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'AI service error');
      }
      
      return response.data.result || {
        message: 'Sorry, I couldn\'t process your request.',
        displayMode: 'chat_only'
      };

    } catch (error: any) {
      console.error('MCP Service Error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to get AI response. Please try again.';
      
      if (error.isTimeout) {
        errorMessage = 'The AI is processing your request (this can take 2-3 minutes on first use while the model loads). Please wait a moment and try again, or try a simpler question.';
      } else if (error.isNetworkError) {
        errorMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (error.status === 408) {
        errorMessage = 'Request timeout - The AI is taking longer than usual. This might be due to a complex query. Please try again with a simpler request or wait a moment and retry.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Compress image data for AI server processing
   */
  private async compressImageData(base64String: string, maxDimension: number = 300, quality: number = 0.4): Promise<string> {
    try {
      // If already small enough, return as-is
      const originalSize = base64String.length;
      console.log(`Original image size: ${Math.round(originalSize / 1024)}KB`);
      
      if (originalSize < 60000) { // Less than ~60KB
        console.log('Image already small enough, skipping compression');
        return base64String;
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Canvas context not available');
          resolve(base64String);
          return;
        }

        img.onload = () => {
          try {
            const { width, height } = img;
            
            // Calculate new dimensions while maintaining aspect ratio
            let newWidth = width;
            let newHeight = height;
            
            if (width > height) {
              if (width > maxDimension) {
                newWidth = maxDimension;
                newHeight = (height * maxDimension) / width;
              }
            } else {
              if (height > maxDimension) {
                newHeight = maxDimension;
                newWidth = (width * maxDimension) / height;
              }
            }

            // Set canvas size
            canvas.width = Math.floor(newWidth);
            canvas.height = Math.floor(newHeight);

            // Configure canvas for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium';

            // Draw resized image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert to JPEG with specified quality
            let result = canvas.toDataURL('image/jpeg', quality);
            
            // If still too large, try lower quality
            if (result.length > 80000) {
              result = canvas.toDataURL('image/jpeg', 0.3);
            }
            
            // If still too large, reduce dimensions more
            if (result.length > 80000) {
              const smallerDimension = Math.floor(maxDimension * 0.7);
              
              if (width > height) {
                canvas.width = smallerDimension;
                canvas.height = Math.floor((height * smallerDimension) / width);
              } else {
                canvas.height = smallerDimension;
                canvas.width = Math.floor((width * smallerDimension) / height);
              }
              
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              result = canvas.toDataURL('image/jpeg', 0.2);
            }

            const compressedSize = result.length;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
            console.log(`Image compressed: ${Math.round(originalSize / 1024)}KB -> ${Math.round(compressedSize / 1024)}KB (${compressionRatio}% reduction)`);
            
            resolve(result);
          } catch (error) {
            console.error('Canvas processing error:', error);
            resolve(base64String);
          }
        };

        img.onerror = (error) => {
          console.error('Image load error:', error);
          resolve(base64String);
        };

        // Load image
        img.src = base64String;
      });

    } catch (error) {
      console.error('Image compression failed:', error);
      return base64String;
    }
  }

  /**
   * Send image with query for analysis - integrated with backend image processing
   */
  async sendImageQuery(query: string, base64String: string, progressCallback?: ProgressCallback): Promise<NexResponse> {
    try {
      console.log(`Processing image query: "${query}"`);
      console.log(`Original image size: ${Math.round(base64String.length / 1024)}KB`);
      
      // Compress image before sending to backend - CRITICAL for payload size
      let compressedImage: string;
      try {
        compressedImage = await this.compressImageData(base64String);
        console.log(`Compressed image size: ${Math.round(compressedImage.length / 1024)}KB`);
        
        // Verify compression worked
        if (compressedImage.length >= base64String.length) {
          console.warn('Compression did not reduce size, using original');
          compressedImage = base64String;
        }
      } catch (compressionError) {
        console.error('Image compression failed, using original:', compressionError);
        compressedImage = base64String;
      }

      // Use aiHttpService for image query requests with progress callback
      const response = await aiHttpService.aiRequest<AIResponse>(
        '/api/ai/query-image',
        { 
          query,
          imageData: compressedImage,
          userId: 1,
          conversationHistory: []
        },
        {}, // Additional config if needed
        progressCallback
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'AI image service error');
      }
      
      return response.data.result || {
        message: 'Sorry, I could not process your image request.',
        displayMode: 'chat_only'
      };

    } catch (error: any) {
      console.error('MCP Image Service Error:', error);
      
      // Enhanced error handling for image queries
      let errorMessage = 'Failed to analyze image. Please try again.';
      
      if (error.isTimeout) {
        errorMessage = 'Image analysis is taking longer than expected (this can happen on first use). Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Send image for analysis (legacy method - kept for backward compatibility)
   */
  async sendImage(base64String: string): Promise<{ caption: string }> {
    try {
      // Use the new image query method with a default query
      const result = await this.sendImageQuery("What is in this image?", base64String);
      return { caption: result.message || 'Unable to analyze image' };
    } catch (error) {
      console.error('Image Analysis Error:', error);
      return { caption: 'Sorry, I couldn\'t analyze this image.' };
    }
  }
}

// Create singleton instance
export const mcpService = new McpService();

/**
 * Factory function to create MCP client (backward compatibility)
 */
export function createMcpClient(token?: string | null): McpClient {
  return mcpService;
}

export default mcpService;
