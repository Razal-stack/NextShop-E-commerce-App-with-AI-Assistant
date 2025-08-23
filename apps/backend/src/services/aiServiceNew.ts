import axios from 'axios';
import { AIOrchestrator, ConversationMessage } from './aiOrchestrator';

// Conversation context interface
export interface ConversationContext {
  products: any[];
  categories: string[];
  priceRanges: string[];
  lastQuery: string;
  lastIntent: string;
}

/**
 * AI Service - Main interface for AI functionality
 * Now uses LangChain orchestration instead of direct AI server execution planning
 */
export class AIService {
  private aiOrchestrator: AIOrchestrator;
  private conversationContext: ConversationContext;

  constructor() {
    this.aiOrchestrator = new AIOrchestrator();
    this.conversationContext = {
      products: [],
      categories: [],
      priceRanges: [],
      lastQuery: '',
      lastIntent: ''
    };
  }

  async processQuery(query: string, conversationHistory: ConversationMessage[] = [], userId?: number) {
    console.log(`🧠 [AI Service] Processing query: "${query}"`);
    
    try {
      // Update conversation context
      this.updateConversationContext({ lastQuery: query });
      
      console.log(`🧠 [AI Service] Updated conversation context:`, this.conversationContext);

      // Use LangChain orchestrator for complete handling
      const result = await this.aiOrchestrator.processQuery(query, conversationHistory, userId);
      
      console.log(`🤖 [AI Service] AI Orchestrator result:`, JSON.stringify(result, null, 2));

      // Update context with results
      if (result.success && result.data) {
        if (result.intent === 'product_search' && result.data.products) {
          this.updateConversationContext({
            products: result.data.products,
            categories: result.data.appliedFilters?.categories || [],
            priceRanges: result.data.priceRange ? [result.data.priceRange] : [],
            lastIntent: result.intent
          });
        }
      }

      return result;

    } catch (error) {
      console.error(`❌ [AI Service] Query processing failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        intent: 'error',
        message: 'Sorry, I encountered an error processing your request.'
      };
    }
  }

  private updateConversationContext(updates: Partial<ConversationContext>) {
    this.conversationContext = { ...this.conversationContext, ...updates };
    console.log(`📊 [AI Service] Updated context with ${Object.keys(updates).length} fields`);
  }

  getConversationContext(): ConversationContext {
    return { ...this.conversationContext };
  }

  clearConversationContext() {
    this.conversationContext = {
      products: [],
      categories: [],
      priceRanges: [],
      lastQuery: '',
      lastIntent: ''
    };
    console.log(`🗑️ [AI Service] Cleared conversation context`);
  }
}
