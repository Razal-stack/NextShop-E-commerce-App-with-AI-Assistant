// apps/web/src/config/aiAssistant.config.ts
import { AIAssistantConfig } from '@nextshop/ai-assistant';

export const nexAssistantConfig: AIAssistantConfig = {
  assistantName: "Nex AI Assistant",
  assistantDescription: "Your Shopping Copilot",
  suggestedQuestions: [
    "Show me trending products",
    "Find products under £100", 
    "What's the best rated product?",
    "Help me find a gift for someone",
    "Show me today's deals",
    "Compare products for me",
  ],
  theme: {
    primaryColor: "blue-600",
    gradientFrom: "blue-600",
    gradientTo: "purple-600",
  },
};
