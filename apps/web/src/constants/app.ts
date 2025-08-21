/**
 * Application constants and configuration
 */

export const APP_CONFIG = {
  name: 'NextShop',
  version: '1.0.0',
  description: 'Modern E-commerce App with AI Assistant'
} as const;

export const API_ENDPOINTS = {
  BACKEND: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  MCP_SERVER: process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3001'
} as const;

// Dynamic product categories - fetched from API
export const PRODUCT_CATEGORIES: string[] = [];

export const SORT_OPTIONS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

export const UI_CONSTANTS = {
  HEADER_HEIGHT: 64,
  AI_ASSISTANT_WIDTH: 400,
  AI_ASSISTANT_HEIGHT: 600,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024
} as const;
