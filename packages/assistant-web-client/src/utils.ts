/**
 * @nextshop/assistant-web-client - Utility Functions
 * 
 * UI/UX helper functions for the assistant
 */

import type { AssistantMessage, Position, AssistantTheme } from './types';

// ==================== MESSAGE UTILITIES ====================

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createUserMessage(content: string): AssistantMessage {
  return {
    id: generateMessageId(),
    content,
    sender: 'user',
    timestamp: new Date(),
  };
}

export function createAssistantMessage(content: string): AssistantMessage {
  return {
    id: generateMessageId(),
    content,
    sender: 'assistant',
    timestamp: new Date(),
  };
}

// ==================== POSITION UTILITIES ====================

export function clampPosition(position: Position, bounds?: { minX?: number; maxX?: number; minY?: number; maxY?: number }): Position {
  if (!bounds) return position;
  
  return {
    x: Math.max(bounds.minX ?? -Infinity, Math.min(position.x, bounds.maxX ?? Infinity)),
    y: Math.max(bounds.minY ?? -Infinity, Math.min(position.y, bounds.maxY ?? Infinity))
  };
}

export function calculateResponsivePosition(windowWidth: number, windowHeight: number): Position {
  return {
    x: windowWidth - 80,  // Right side with padding
    y: windowHeight - 80  // Bottom with padding
  };
}

// ==================== THEME UTILITIES ====================

export function mergeTheme(baseTheme: AssistantTheme, customTheme: Partial<AssistantTheme>): AssistantTheme {
  return {
    ...baseTheme,
    ...customTheme,
    fontSize: { ...baseTheme.fontSize, ...customTheme.fontSize },
    spacing: { ...baseTheme.spacing, ...customTheme.spacing },
    animation: { ...baseTheme.animation, ...customTheme.animation },
    userMessage: { ...baseTheme.userMessage, ...customTheme.userMessage },
    assistantMessage: { ...baseTheme.assistantMessage, ...customTheme.assistantMessage }
  };
}

// ==================== VALIDATION UTILITIES ====================

export function validateMessage(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }
  
  if (content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 1000) {
    return { valid: false, error: 'Message is too long (max 1000 characters)' };
  }
  
  return { valid: true };
}

// ==================== TEXT UTILITIES ====================

export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}