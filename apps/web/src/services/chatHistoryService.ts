/**
 * Chat History Service
 * Manages chat sessions, automatic title generation, and persistence
 */

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'nex';
  timestamp: Date;
  data?: {
    products?: any[];
    totalFound?: number;
    displayMode?: string;
  };
  actions?: Array<{
    type: string;
    payload: any;
  }>;
  preprocessed?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  preview: string; // Last message preview
}

export class ChatHistoryService {
  private static readonly STORAGE_KEY = 'nextshop_chat_history';
  private static readonly MAX_SESSIONS = 50; // Limit to prevent storage bloat

  /**
   * Get sessions filtered by category
   */
  static getSessionsByCategory(category: 'recent' | 'products' | 'budget' | 'favorites'): ChatSession[] {
    const sessions = this.getSessions();
    
    switch (category) {
      case 'recent':
        return sessions.slice(0, 10);
      case 'products':
        return sessions.filter(session => 
          session.title.includes('👕') || session.title.includes('🧥') || 
          session.title.includes('👖') || session.title.includes('👗') ||
          session.title.includes('👟') || session.title.includes('💍')
        );
      case 'budget':
        return sessions.filter(session => 
          session.title.includes('💰') || session.title.toLowerCase().includes('under') ||
          session.title.includes('£')
        );
      case 'favorites':
        return sessions.filter(session => session.messages.length > 5); // Active conversations
      default:
        return sessions;
    }
  }

  /**
   * Search sessions by query
   */
  static searchSessions(query: string): ChatSession[] {
    if (!query.trim()) return this.getSessions();
    
    const searchTerm = query.toLowerCase();
    return this.getSessions().filter(session =>
      session.title.toLowerCase().includes(searchTerm) ||
      session.preview.toLowerCase().includes(searchTerm) ||
      session.messages.some(msg => 
        msg.text.toLowerCase().includes(searchTerm)
      )
    );
  }

  /**
   * Get all chat sessions, sorted by most recent
   */
  static getSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      return sessions
        .map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        .sort((a: ChatSession, b: ChatSession) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  }

  /**
   * Get a specific chat session
   */
  static getSession(sessionId: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find(session => session.id === sessionId) || null;
  }

  /**
   * Create a new chat session
   */
  static createSession(): ChatSession {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      preview: 'Start a new conversation...'
    };

    // Mark all other sessions as inactive
    const sessions = this.getSessions().map(session => ({
      ...session,
      isActive: false
    }));

    sessions.unshift(newSession);
    this.saveSessions(sessions);
    
    return newSession;
  }

  /**
   * Add a message to a session and update the title if needed
   */
  static addMessage(sessionId: string, message: ChatMessage): void {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) return;

    const session = sessions[sessionIndex];
    session.messages.push(message);
    session.updatedAt = new Date();
    session.preview = this.generatePreview(message);

    // Auto-generate title after first user message
    if (session.messages.length === 1 && message.sender === 'user') {
      session.title = this.generateTitle(message.text);
    }

    this.saveSessions(sessions);
  }

  /**
   * Update an entire session (for bulk updates)
   */
  static updateSession(sessionId: string, messages: ChatMessage[]): void {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) return;

    const session = sessions[sessionIndex];
    session.messages = messages;
    session.updatedAt = new Date();
    
    if (messages.length > 0) {
      session.preview = this.generatePreview(messages[messages.length - 1]);
      
      // Update title based on first user message
      const firstUserMessage = messages.find(msg => msg.sender === 'user');
      if (firstUserMessage && session.title === 'New Chat') {
        session.title = this.generateTitle(firstUserMessage.text);
      }
    }

    this.saveSessions(sessions);
  }

  /**
   * Set active session
   */
  static setActiveSession(sessionId: string): void {
    const sessions = this.getSessions();
    const updatedSessions = sessions.map(session => ({
      ...session,
      isActive: session.id === sessionId
    }));
    this.saveSessions(updatedSessions);
  }

  /**
   * Delete a session
   */
  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter(session => session.id !== sessionId);
    this.saveSessions(sessions);
  }

  /**
   * Clear all sessions
   */
  static clearAllSessions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Generate smart title from user query
   */
  private static generateTitle(userMessage: string): string {
    const text = userMessage.toLowerCase().trim();
    
    // Product search patterns
    if (text.includes('jacket') || text.includes('coat')) {
      return `🧥 ${this.extractProductQuery(text, 'jackets')}`;
    }
    if (text.includes('shirt') || text.includes('top')) {
      return `👕 ${this.extractProductQuery(text, 'shirts')}`;
    }
    if (text.includes('pants') || text.includes('trousers') || text.includes('jeans')) {
      return `👖 ${this.extractProductQuery(text, 'pants')}`;
    }
    if (text.includes('dress')) {
      return `👗 ${this.extractProductQuery(text, 'dresses')}`;
    }
    if (text.includes('shoes') || text.includes('sneakers') || text.includes('boots')) {
      return `👟 ${this.extractProductQuery(text, 'shoes')}`;
    }
    if (text.includes('jewelry') || text.includes('ring') || text.includes('necklace')) {
      return `💍 ${this.extractProductQuery(text, 'jewelry')}`;
    }

    // Price-based searches
    if (text.includes('under') || text.includes('below') || text.includes('£') || text.includes('pound')) {
      const priceMatch = text.match(/under|below|£(\d+)|(\d+)\s*pound/);
      if (priceMatch) {
        return `💰 Budget Search`;
      }
    }

    // Gender-specific searches
    if (text.includes("men's") || text.includes('mens') || text.includes('male')) {
      return `👨 Men's Products`;
    }
    if (text.includes("women's") || text.includes('womens') || text.includes('female') || text.includes('ladies')) {
      return `👩 Women's Products`;
    }

    // General queries
    if (text.includes('find') || text.includes('search') || text.includes('show') || text.includes('looking')) {
      return `Product Search`;
    }

    // Fallback to first few words
    const words = text.split(' ').slice(0, 4).join(' ');
    return `${words.charAt(0).toUpperCase() + words.slice(1)}`;
  }

  /**
   * Extract meaningful product query from text
   */
  private static extractProductQuery(text: string, fallback: string): string {
    // Extract budget info
    const budgetMatch = text.match(/under|below\s*£?(\d+)|£(\d+)/);
    const budget = budgetMatch ? `Under £${budgetMatch[1] || budgetMatch[2]}` : '';

    // Extract gender
    const gender = text.includes("men's") || text.includes('mens') ? "Men's" : 
                  text.includes("women's") || text.includes('womens') || text.includes('ladies') ? "Women's" : '';

    // Extract color
    const colorMatch = text.match(/\b(black|white|red|blue|green|yellow|pink|purple|brown|gray|grey|navy|beige)\b/i);
    const color = colorMatch ? colorMatch[1] : '';

    // Combine parts
    const parts = [gender, color, fallback, budget].filter(Boolean);
    return parts.join(' ') || fallback;
  }

  /**
   * Generate message preview
   */
  private static generatePreview(message: ChatMessage): string {
    if (message.sender === 'user') {
      return message.text.slice(0, 50) + (message.text.length > 50 ? '...' : '');
    } else {
      if (message.data?.products?.length) {
        return `Found ${message.data.products.length} products`;
      }
      return message.text.slice(0, 50) + (message.text.length > 50 ? '...' : '');
    }
  }

  /**
   * Save sessions to localStorage
   */
  private static saveSessions(sessions: ChatSession[]): void {
    try {
      // Limit number of sessions to prevent storage bloat
      const limitedSessions = sessions.slice(0, this.MAX_SESSIONS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedSessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
      
      // If storage is full, try to clear old sessions and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        const reducedSessions = sessions.slice(0, 20); // Keep only 20 most recent
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedSessions));
        } catch (retryError) {
          console.error('Failed to save even reduced sessions:', retryError);
        }
      }
    }
  }

  /**
   * Export chat history for backup
   */
  static exportHistory(): string {
    const sessions = this.getSessions();
    return JSON.stringify(sessions, null, 2);
  }

  /**
   * Import chat history from backup
   */
  static importHistory(jsonData: string): boolean {
    try {
      const sessions = JSON.parse(jsonData);
      if (Array.isArray(sessions)) {
        this.saveSessions(sessions);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import chat history:', error);
      return false;
    }
  }
}
