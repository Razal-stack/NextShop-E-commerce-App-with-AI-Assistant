/**
 * Utility functions for MCP server
 */

export function validateProductId(id: any): boolean {
  return typeof id === 'number' && id > 0 && Number.isInteger(id);
}

export function validateUserId(id: any): boolean {
  return typeof id === 'number' && id > 0 && Number.isInteger(id);
}

export function validateQuantity(quantity: any): boolean {
  return typeof quantity === 'number' && quantity > 0 && Number.isInteger(quantity);
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function createErrorResponse(message: string, code?: string) {
  return {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    }
  };
}

export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}
