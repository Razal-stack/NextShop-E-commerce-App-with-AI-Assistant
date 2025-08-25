/**
 * @nextshop/assistant-web-client - Clean UI Types
 * 
 * Only UI/UX related types - no business logic
 */

import React from 'react';

// ==================== CORE UI TYPES ====================

export interface Position {
  x: number;
  y: number;
}

export interface AssistantMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface AssistantState {
  isExpanded: boolean;
  position: Position;
  messages: AssistantMessage[];
  isProcessing: boolean;
  inputValue: string;
}

// ==================== COMPONENT PROPS ====================

export interface AssistantUIProps {
  // Message handling
  messages: AssistantMessage[];
  onSendMessage: (message: string) => void;
  
  // State
  isExpanded: boolean;
  isProcessing: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  
  // Position & dragging
  position: Position;
  onPositionChange: (position: Position) => void;
  enableDragging?: boolean;
  
  // Expand/collapse
  onToggleExpanded: () => void;
  onReset?: () => void;
  
  // UI Configuration
  config?: AssistantConfig;
  theme?: AssistantTheme;
  
  // Custom rendering
  renderMessage?: (message: AssistantMessage) => React.ReactNode;
  renderCustomContent?: () => React.ReactNode;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

export interface QuickSuggestion {
  icon?: React.ComponentType<any> | string;
  text: string;
  category?: string;
}

export interface AssistantConfig {
  // Basic info
  title?: string;
  subtitle?: string;
  avatar?: string;
  collapsedIcon?: string;
  
  // Dimensions
  width?: number;
  height?: number;
  collapsedSize?: number;
  
  // Text
  placeholder?: string;
  welcomeTitle?: string;
  welcomeDescription?: string;
  quickSuggestions?: QuickSuggestion[];
  placeholderQueries?: string[];
  
  // Features
  enableDragging?: boolean;
  enableVoice?: boolean;
  enableImage?: boolean;
  enableReset?: boolean;
  
  // Positioning
  defaultPosition?: Position;
  boundaries?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

export interface AssistantTheme {
  // Colors
  primary?: string;
  primaryHover?: string;
  primaryLight?: string;
  surface?: string;
  surfaceHover?: string;
  background?: string;
  border?: string;
  borderHover?: string;
  text?: string;
  textSecondary?: string;
  textMuted?: string;
  success?: string;
  warning?: string;
  error?: string;
  
  // Shadows
  shadow?: string;
  shadowSmall?: string;
  
  // Border radius
  borderRadius?: string;
  borderRadiusSmall?: string;
  borderRadiusLarge?: string;
  
  // Layout
  zIndexModal?: number;
  
  // Typography
  fontSize?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  
  // Spacing
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  
  // Animation
  animation?: {
    fast?: string;
    normal?: string;
    slow?: string;
  };
  
  // Message styling
  userMessage?: {
    background?: string;
    text?: string;
    borderRadius?: string;
  };
  
  assistantMessage?: {
    background?: string;
    text?: string;
    borderRadius?: string;
  };
  
  // Gradients
  brandGradient?: string;
  backgroundGradient?: string;
}