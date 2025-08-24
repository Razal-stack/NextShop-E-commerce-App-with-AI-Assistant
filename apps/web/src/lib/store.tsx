'use client';

import React, { createContext, ReactNode } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Product, CartItem, UserSession, SmartList, AssistantMessage } from './types';

// Store interfaces
interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  data?: any;
  actions?: any[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AuthenticationStore {
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  isLoggingInViaChat: boolean;
  tempCredentials: { username: string; password: string } | null;
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  setLoggingInViaChat: (via: boolean) => void;
  setTempCredentials: (creds: { username: string; password: string } | null) => void;
  loginViaChat: (username: string, password: string) => Promise<boolean>;
}

interface ChatHistoryStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isHistoryOpen: boolean;
  addSession: (messages: ChatMessage[], title?: string) => string;
  updateSession: (id: string, messages: ChatMessage[]) => void;
  deleteSession: (id: string) => void;
  loadSession: (id: string) => ChatMessage[] | null;
  setCurrentSession: (id: string | null) => void;
  setHistoryOpen: (open: boolean) => void;
  generateSessionTitle: (messages: ChatMessage[]) => string;
  clearAllSessions: () => void;
}

interface CartStore {
  items: CartItem[];
  cartId: number | null;
  pendingItems: Product[]; // Items waiting for authentication
  addItem: (product: Product, quantity?: number) => Promise<boolean>;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadCartFromData: (cartItems: CartItem[], cartId?: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setCartId: (cartId: number | null) => void;
  processPendingItems: () => void;
  clearPendingItems: () => void;
}

interface WishlistStore {
  items: Product[];
  pendingItems: Product[]; // Items waiting for authentication
  addItem: (product: Product) => Promise<boolean>;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  processPendingItems: () => void;
  clearPendingItems: () => void;
}

interface UserStore {
  session: UserSession | null;
  setSession: (session: UserSession) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
  // Convenience getters
  getUser: () => UserSession | null;
  getToken: () => string | null;
  getUserId: () => number | null;
}

interface UIStore {
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isAssistantOpen: boolean;
  assistantPosition: { x: number; y: number };
  products: Product[];
  setCartOpen: (open: boolean) => void;
  setWishlistOpen: (open: boolean) => void;
  setAssistantOpen: (open: boolean) => void;
  setAssistantPosition: (position: { x: number; y: number }) => void;
  setProducts: (products: Product[]) => void;
  addToCart: (product: Product) => void;
  addToWishlist: (product: Product) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
}

export interface UIStoreType extends UIStore {}

interface SmartListStore {
  lists: SmartList[];
  addList: (list: Omit<SmartList, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateList: (id: string, updates: Partial<SmartList>) => void;
  removeList: (id: string) => void;
  getList: (id: string) => SmartList | undefined;
}

interface AssistantStore {
  messages: AssistantMessage[];
  isTyping: boolean;
  currentPlan: any | null;
  addMessage: (message: Omit<AssistantMessage, 'id' | 'timestamp'>) => void;
  setTyping: (typing: boolean) => void;
  setCurrentPlan: (plan: any) => void;
  clearMessages: () => void;
}

// Enhanced Authentication Store
export const useAuthStore = create<AuthenticationStore>()(
  devtools((set, get) => ({
    isAuthModalOpen: false,
    authMode: 'login',
    isLoggingInViaChat: false,
    tempCredentials: null,
    setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
    setAuthMode: (mode) => set({ authMode: mode }),
    setLoggingInViaChat: (via) => set({ isLoggingInViaChat: via }),
    setTempCredentials: (creds) => set({ tempCredentials: creds }),
    loginViaChat: async (username, password) => {
      try {
        // Simulate login API call
        set({ tempCredentials: { username, password } });
        
        // Mock login - in real app, call actual API
        if (username && password) {
          const userStore = useUserStore.getState();
          userStore.setSession({
            token: 'mock-token',
            userId: 1,
            username: username,
            isAuthenticated: true,
          });
          
          // Process pending items
          const cartStore = useCartStore.getState();
          const wishlistStore = useWishlistStore.getState();
          cartStore.processPendingItems();
          wishlistStore.processPendingItems();
          
          set({ isLoggingInViaChat: false, tempCredentials: null });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      }
    },
  }))
);

// Enhanced Chat History Store
export const useChatHistoryStore = create<ChatHistoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        sessions: [],
        currentSessionId: null,
        isHistoryOpen: false,
        addSession: (messages, title) => {
          const sessionId = crypto.randomUUID();
          const newSession: ChatSession = {
            id: sessionId,
            title: title || get().generateSessionTitle(messages),
            messages: messages.map(msg => ({ ...msg })),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ 
            sessions: [newSession, ...state.sessions.slice(0, 19)] // Keep last 20 sessions
          }));
          return sessionId;
        },
        updateSession: (id, messages) =>
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === id 
                ? { 
                    ...session, 
                    messages: messages.map(msg => ({ ...msg })), 
                    title: get().generateSessionTitle(messages),
                    updatedAt: new Date() 
                  }
                : session
            ),
          })),
        deleteSession: (id) =>
          set((state) => ({
            sessions: state.sessions.filter((session) => session.id !== id),
            currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
          })),
        loadSession: (id) => {
          const session = get().sessions.find((s) => s.id === id);
          return session ? session.messages : null;
        },
        setCurrentSession: (id) => set({ currentSessionId: id }),
        setHistoryOpen: (open) => set({ isHistoryOpen: open }),
        generateSessionTitle: (messages) => {
          const userMessages = messages.filter(msg => msg.sender === 'user');
          if (userMessages.length === 0) return 'New Chat';
          
          const firstUserMessage = userMessages[0].text;
          if (firstUserMessage.length <= 30) return firstUserMessage;
          
          // Auto-generate title based on content
          if (firstUserMessage.toLowerCase().includes('find') || firstUserMessage.toLowerCase().includes('search')) {
            return `Search: ${firstUserMessage.substring(0, 25)}...`;
          }
          if (firstUserMessage.toLowerCase().includes('product') || firstUserMessage.toLowerCase().includes('buy')) {
            return `${firstUserMessage.substring(0, 25)}...`;
          }
          if (firstUserMessage.toLowerCase().includes('help')) {
            return `❓ ${firstUserMessage.substring(0, 25)}...`;
          }
          return `${firstUserMessage.substring(0, 25)}...`;
        },
        clearAllSessions: () => set({ sessions: [], currentSessionId: null }),
      }),
      {
        name: 'nextshop-chat-history',
      }
    )
  )
);

// Enhanced Cart Store with Authentication
export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        cartId: null,
        pendingItems: [],
        addItem: async (product, quantity = 1) => {
          const userStore = useUserStore.getState();
          
          if (!userStore.isAuthenticated()) {
            // Add to pending items and require authentication
            set((state) => ({
              pendingItems: [...state.pendingItems.filter(p => p.id !== product.id), product]
            }));
            // Just show a toast - no auth modal since we're simplifying
            const { toast } = require('sonner');
            toast.info('Please sign in to add items to your cart');
            return false;
          }
          
          set((state) => {
            const existingItem = state.items.find((item) => item.id === product.id);
            if (existingItem) {
              return {
                items: state.items.map((item) =>
                  item.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              };
            }
            return {
              items: [
                ...state.items,
                {
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.image,
                  quantity,
                },
              ],
            };
          });
          return true;
        },
        removeItem: (productId) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
          })),
        updateQuantity: (productId, quantity) =>
          set((state) => {
            if (quantity <= 0) {
              return {
                items: state.items.filter((item) => item.id !== productId),
              };
            }
            return {
              items: state.items.map((item) =>
                item.id === productId ? { ...item, quantity } : item
              ),
            };
          }),
        clearCart: () => set({ items: [], cartId: null }),
        loadCartFromData: (cartItems, cartId) => set({ items: cartItems, cartId: cartId || null }),
        setCartId: (cartId) => set({ cartId }),
        getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
        getTotalPrice: () =>
          get().items.reduce((total, item) => total + item.price * item.quantity, 0),
        processPendingItems: () => {
          const pendingItems = get().pendingItems;
          set({ pendingItems: [] });
          pendingItems.forEach((product) => {
            get().addItem(product);
          });
        },
        clearPendingItems: () => set({ pendingItems: [] }),
      }),
      {
        name: 'nextshop-cart',
      }
    )
  )
);

// Enhanced Wishlist Store with Authentication
export const useWishlistStore = create<WishlistStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        pendingItems: [],
        addItem: async (product) => {
          const userStore = useUserStore.getState();
          
          if (!userStore.isAuthenticated()) {
            // Add to pending items and require authentication
            set((state) => ({
              pendingItems: [...state.pendingItems.filter(p => p.id !== product.id), product]
            }));
            // Just show a toast - no auth modal since we're simplifying
            const { toast } = require('sonner');
            toast.info('Please sign in to add items to your wishlist');
            return false;
          }
          
          set((state) => {
            if (state.items.find((item) => item.id === product.id)) {
              return state;
            }
            return { items: [...state.items, product] };
          });
          return true;
        },
        removeItem: (productId) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
          })),
        isInWishlist: (productId) =>
          get().items.some((item) => item.id === productId),
        clearWishlist: () => set({ items: [] }),
        processPendingItems: () => {
          const pendingItems = get().pendingItems;
          set({ pendingItems: [] });
          pendingItems.forEach((product) => {
            get().addItem(product);
          });
        },
        clearPendingItems: () => set({ pendingItems: [] }),
      }),
      {
        name: 'nextshop-wishlist',
      }
    )
  )
);

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        session: null,
        setSession: (session) => {
          set({ session });
          // Notify all components about auth state change
          setTimeout(() => {
            window.dispatchEvent(new Event('auth-state-changed'));
          }, 0);
        },
        clearSession: () => {
          set({ session: null });
          // Notify all components about auth state change
          setTimeout(() => {
            window.dispatchEvent(new Event('auth-state-changed'));
          }, 0);
        },
        isAuthenticated: () => {
          const session = get().session;
          return !!session?.isAuthenticated && !!session?.token;
        },
        // Convenience getters for easy access
        getUser: () => get().session,
        getToken: () => get().session?.token || null,
        getUserId: () => get().session?.userId || null,
      }),
      {
        name: 'nextshop-user',
      }
    )
  )
);

// Start with empty products - will be populated by API
const mockProducts: Product[] = [];

export const useUIStore = create<UIStore>()(
  devtools((set, get) => ({
    isCartOpen: false,
    isWishlistOpen: false,
    isAssistantOpen: false,
    assistantPosition: { x: 20, y: 20 },
    products: mockProducts,
    setCartOpen: (open) => set({ isCartOpen: open }),
    setWishlistOpen: (open) => set({ isWishlistOpen: open }),
    setAssistantOpen: (open) => set({ isAssistantOpen: open }),
    setAssistantPosition: (position) => set({ assistantPosition: position }),
    setProducts: (products) => set({ products }),
    addToCart: (product) => {
      const cartStore = useCartStore.getState();
      cartStore.addItem(product);
    },
    addToWishlist: (product) => {
      const wishlistStore = useWishlistStore.getState();
      wishlistStore.addItem(product);
    },
    updateCartQuantity: (productId, quantity) => {
      const cartStore = useCartStore.getState();
      cartStore.updateQuantity(productId, quantity);
    },
  }))
);

export const useSmartListStore = create<SmartListStore>()(
  devtools(
    persist(
      (set, get) => ({
        lists: [],
        addList: (listData) => {
          const newList: SmartList = {
            ...listData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ lists: [...state.lists, newList] }));
        },
        updateList: (id, updates) =>
          set((state) => ({
            lists: state.lists.map((list) =>
              list.id === id ? { ...list, ...updates, updatedAt: new Date() } : list
            ),
          })),
        removeList: (id) =>
          set((state) => ({
            lists: state.lists.filter((list) => list.id !== id),
          })),
        getList: (id) => get().lists.find((list) => list.id === id),
      }),
      {
        name: 'nextshop-smart-lists',
      }
    )
  )
);

export const useAssistantStore = create<AssistantStore>()(
  devtools((set, get) => ({
    messages: [
      {
        id: '1',
        content: "Hi! I'm Nex, your AI shopping assistant. How can I help you find the perfect products today? ✨",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'text',
      },
    ],
    isTyping: false,
    currentPlan: null,
    addMessage: (messageData) => {
      const newMessage: AssistantMessage = {
        ...messageData,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      set((state) => ({ messages: [...state.messages, newMessage] }));
    },
    setTyping: (typing) => set({ isTyping: typing }),
    setCurrentPlan: (plan) => set({ currentPlan: plan }),
    clearMessages: () =>
      set({
        messages: [
          {
            id: '1',
            content: "Hi! I'm Nex, your AI shopping assistant. How can I help you find the perfect products today? ✨",
            sender: 'assistant',
            timestamp: new Date(),
            type: 'text',
          },
        ],
      }),
  }))
);

// Store provider context (simple, no JSX needed since we're using Zustand)
const StoreContext = createContext<null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  return React.createElement(StoreContext.Provider, { value: null }, children);
}
