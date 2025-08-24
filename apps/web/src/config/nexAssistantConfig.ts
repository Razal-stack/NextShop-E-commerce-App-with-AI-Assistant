/**
 * Nex Assistant Configuration
 * Centralized configuration for the AI shopping assistant
 */

import { Search, ShoppingCart, Heart, Sparkles, Zap, Clock } from 'lucide-react';

export interface QuickSuggestion {
  icon: any; // Lucide icon component
  text: string;
  category: string;
}

export interface LoadingState {
  stage: string;
  message: string;
  timeRange: {
    min: number;
    max: number;
  };
}

export interface NexAssistantConfig {
  welcomeTitle: string;
  welcomeDescription: string;
  quickSuggestionsTitle: string;
  quickSuggestions: QuickSuggestion[];
  placeholderQueries: string[];
  loadingStates: LoadingState[];
  loadingMessages: {
    longProcessingTitle: string;
    longProcessingMessage: string;
    maxTimeMessage: string;
  };
}

export const nexAssistantConfig: NexAssistantConfig = {
  welcomeTitle: "Welcome! I'm Nex, Your Shopping Assistant",
  welcomeDescription: "I'll help you find the perfect products within your budget and specifications. Let's discover something amazing together!",
  quickSuggestionsTitle: "Quick searches to get you started",
  
  quickSuggestions: [
    { 
      icon: Search, 
      text: "Ask: 'Find electronics under £200'", 
      category: "electronics" 
    },
    { 
      icon: ShoppingCart, 
      text: "Ask: 'Show me trending clothes'", 
      category: "clothing" 
    },
    { 
      icon: Heart, 
      text: "Ask: 'What are the best rated products?'", 
      category: "popular" 
    },
    { 
      icon: Search, 
      text: "Try: 'Find gifts for birthdays'", 
      category: "gifts" 
    },
    { 
      icon: ShoppingCart, 
      text: "Find men's jacket under 100 pound and add it to cart", 
      category: "menswear" 
    },
    { 
      icon: Heart, 
      text: "Show me the top jewelery", 
      category: "jewelery" 
    }
  ],
  
  placeholderQueries: [
    "Hello! How can I help you?",
    "Find products under £200",
    "What are you looking for?",
    "Ask me anything!",
  ],

  loadingStates: [
    {
      stage: "analyzing",
      message: "Analyzing request",
      timeRange: { min: 0, max: 30 }
    },
    {
      stage: "searching",
      message: "Searching products",
      timeRange: { min: 30, max: 60 }
    },
    {
      stage: "processing",
      message: "Finding best matches",
      timeRange: { min: 60, max: 120 }
    },
    {
      stage: "finalizing",
      message: "Preparing results",
      timeRange: { min: 120, max: Infinity }
    }
  ],

  loadingMessages: {
    longProcessingTitle: "Advanced Search",
    longProcessingMessage: "Complex searches take a moment to find the perfect products for you. Thank you for your patience!",
    maxTimeMessage: "Up to 3 min"
  }
};

export default nexAssistantConfig;
