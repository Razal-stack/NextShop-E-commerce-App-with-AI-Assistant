// packages/ai-assistant/src/context.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { McpClient, AIAssistantConfig } from './types';

interface AIAssistantContextType {
  client: McpClient;
  config: AIAssistantConfig;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
}

interface AIAssistantProviderProps {
  children: ReactNode;
  client: McpClient;
  config: AIAssistantConfig;
}

export function AIAssistantProvider({ children, client, config }: AIAssistantProviderProps) {
  return (
    <AIAssistantContext.Provider value={{ client, config }}>
      {children}
    </AIAssistantContext.Provider>
  );
}
