/**
 * @nextshop/assistant-web-client - Clean Library Export
 * 
 * Simple, focused assistant UI library - UI/UX shell only
 */

// ==================== MAIN EXPORTS ====================

// Core UI component
export { AssistantShell, type AssistantShellProps, type AssistantShellConfig } from './components/AssistantShell';

// General types
export * from './types';

// Utilities
export * from './utils';

// ==================== DEFAULT CONFIGURATIONS ====================

import type { AssistantConfig, AssistantTheme } from './types';

export const DefaultConfig: AssistantConfig = {
  title: 'Assistant',
  subtitle: 'Online',
  avatar: '🤖',
  collapsedIcon: '💬',
  width: 400,
  height: 520,
  collapsedSize: 48,
  placeholder: 'Type your message...',
  welcomeTitle: 'Hello!',
  welcomeDescription: 'How can I help you today?',
  quickSuggestions: [],
  enableDragging: true,
  enableVoice: false,
  enableImage: false,
  enableReset: true,
  defaultPosition: { x: 20, y: 75 }
};

export const DefaultTheme: AssistantTheme = {
  // Colors matching DraggableNexAssistant
  primary: '#0439d7',
  primaryHover: '#1d4ed8',
  primaryLight: '#dbeafe',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  background: '#fafbfc',
  border: 'rgba(0, 0, 0, 0.08)',
  borderHover: '#cbd5e1',
  text: '#1a1a1a',
  textSecondary: '#717182',
  textMuted: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#d4183d',
  
  // Shadows
  shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  shadowSmall: '0 4px 12px rgba(4, 57, 215, 0.15)',
  
  // Border radius
  borderRadius: '12px',
  borderRadiusSmall: '12px',
  borderRadiusLarge: '20px',
  
  // Layout
  zIndexModal: 1000,
  
  // Typography
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px'
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  
  // Animation
  animation: {
    fast: '0.2s ease-in-out',
    normal: '0.3s ease-in-out',
    slow: '0.5s ease-in-out'
  },
  
  // Message styling
  userMessage: {
    background: '#0439d7',
    text: '#ffffff',
    borderRadius: '18px 18px 4px 18px'
  },
  
  assistantMessage: {
    background: '#f8fafc',
    text: '#1e293b',
    borderRadius: '18px 18px 18px 4px'
  },
  
  // Gradients
  brandGradient: 'linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%)',
  backgroundGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
};

// ==================== VERSION INFO ====================

export const VERSION = '1.0.0';
export const LIBRARY_NAME = '@nextshop/assistant-web-client';
