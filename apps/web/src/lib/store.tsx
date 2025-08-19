'use client';

import React, { createContext, ReactNode } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Product, CartItem, UserSession, SmartList, AssistantMessage } from './types';

// Store interfaces
interface CartStore {
  items: CartItem[];
  cartId: number | null; // Track the backend cart ID
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadCartFromData: (cartItems: CartItem[], cartId?: number) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setCartId: (cartId: number | null) => void;
}

interface WishlistStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}

interface UserStore {
  session: UserSession | null;
  setSession: (session: UserSession) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
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

// Zustand stores
export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        cartId: null,
        addItem: (product, quantity = 1) =>
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
          }),
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
      }),
      {
        name: 'nextshop-cart',
      }
    )
  )
);

export const useWishlistStore = create<WishlistStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        addItem: (product) =>
          set((state) => {
            if (state.items.find((item) => item.id === product.id)) {
              return state;
            }
            return { items: [...state.items, product] };
          }),
        removeItem: (productId) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
          })),
        isInWishlist: (productId) =>
          get().items.some((item) => item.id === productId),
        clearWishlist: () => set({ items: [] }),
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
        setSession: (session) => set({ session }),
        clearSession: () => set({ session: null }),
        isAuthenticated: () => !!get().session?.isAuthenticated,
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
