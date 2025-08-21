// packages/ai-assistant/src/types.ts
export interface Message {
  id: string;
  text: string;
  sender: "user" | "nex";
  timestamp: Date;
}

export interface McpClient {
  sendMessage: (messages: Array<{ role: string; content: string }>, overrideQuery?: string) => Promise<string>;
  sendImage: (base64String: string) => Promise<{ caption: string }>;
}

export interface AIAssistantConfig {
  suggestedQuestions: string[];
  assistantName: string;
  assistantDescription: string;
  theme: {
    primaryColor: string;
    gradientFrom: string;
    gradientTo: string;
  };
}
