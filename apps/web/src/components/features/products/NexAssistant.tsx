'use client';

/**
 * NexAssistant - COMPLETE Web App Component
 * Uses @nextshop/assistant-web-client for UI shell
 * Contains ALL business logic, features, and functionality matching DraggableNexAssistant
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantShell, type AssistantShellConfig } from '@nextshop/assistant-web-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  User, 
  LogIn,
  ArrowLeft,
  ArrowRight,
  Package,
  Sparkles,
  MessageCircle,
  Search,
  Check,
  X,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ==================== IMPORTS FOR COMPLETE FUNCTIONALITY ====================
import { nexAssistantConfig } from '@/config/nexAssistantConfig';
import { 
  useCartStore, 
  useWishlistStore, 
  useUserStore,
  useUIStore
} from '@/lib/store';
import { Product } from '@/lib/types';
import { createMcpClient } from '@/services/mcpService';
import { AIAssistantUIHandler, ChatMessage } from '@/lib/aiAssistant/uiHandler';

// ==================== COMPLETE BUSINESS LOGIC TYPES ====================
interface NexAssistantState {
  messages: ChatMessage[];
  isTyping: boolean;
  placeholderIndex: number;
  displayedText: string;
  showQuickSuggestions: boolean;
  typingDots: number;
  processingTime: number;
  showLongProcessingWarning: boolean;
  messagePagination: Map<number, number>;
  showLoginForm: boolean;
  loginCredentials: { username: string; password: string };
  isLoggingIn: boolean;
  pendingAction: { type: 'cart' | 'wishlist', product: Product } | null;
}

// ==================== COMPLETE WEB APP COMPONENT ====================
export const NexAssistant: React.FC<{
  isExpanded: boolean;
  onToggleExpanded: () => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}> = ({
  isExpanded,
  onToggleExpanded,
  position = { x: 20, y: 75 },
  onPositionChange
}) => {
  // ==================== COMPLETE STORE INTEGRATION ====================
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();
  const { session: user, isAuthenticated: isAuthenticatedFn } = useUserStore();
  const isAuthenticated = isAuthenticatedFn();
  const { setCartOpen, setWishlistOpen } = useUIStore();
  const router = useRouter();

  // ==================== COMPLETE STATE MANAGEMENT ====================
  const [inputValue, setInputValue] = useState('');
  const [state, setState] = useState<NexAssistantState>({
    messages: [],
    isTyping: false,
    placeholderIndex: 0,
    displayedText: '',
    showQuickSuggestions: true,
    typingDots: 0,
    processingTime: 0,
    showLongProcessingWarning: false,
    messagePagination: new Map(),
    showLoginForm: false,
    loginCredentials: { username: '', password: '' },
    isLoggingIn: false,
    pendingAction: null
  });

  // ==================== COMPLETE AI HANDLER SETUP ====================
  const uiHandler = new AIAssistantUIHandler({
    onNavigate: (payload) => {
      if (payload.page) {
        router.push(payload.page);
      }
    },
    onProductAction: (action, product) => {
      if (!user) {
        const errorMessage = uiHandler.createErrorMessage('Please log in to add items to your cart or wishlist.');
        setState(prev => ({ ...prev, messages: [...prev.messages, errorMessage] }));
        return;
      }

      if (action === 'add_to_cart') {
        addToCart(product);
      } else if (action === 'add_to_wishlist') {
        addToWishlist(product);
      }
    },
    onUIAction: (action, products) => {
      console.log('UI Action:', action, products);
    },
    onAuthAction: (action) => {
      if (action === 'login') {
        setState(prev => ({ ...prev, showLoginForm: true }));
      }
    },
    onError: (error) => {
      const errorMessage = uiHandler.createErrorMessage(error);
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMessage] }));
    }
  });

  // ==================== CONFIGURATION ====================
  const shellConfig: AssistantShellConfig = {
    title: 'Nex',
    subtitle: 'Your Shopping Assistant',
    placeholder: 'Ask about products, categories, or get recommendations...',
    animatedPlaceholder: state.displayedText || 'What are you looking for today?',
    enableVoice: true,
    enableImage: true,
    enableReset: true
  };

  // ==================== REFERENCES ====================
  const mcpClient = createMcpClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickSearchSuggestions = nexAssistantConfig.quickSuggestions;
  const placeholderQueries = nexAssistantConfig.placeholderQueries;

  // ==================== COMPLETE EFFECT HANDLERS ====================

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  // Clean up pagination state when messages change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      messagePagination: new Map([...prev.messagePagination].filter(([messageIndex]) => 
        messageIndex < prev.messages.length && prev.messages[messageIndex] && prev.messages[messageIndex].products && prev.messages[messageIndex].products!.length > 0
      ))
    }));
  }, [state.messages.length]);

  // Animated typing dots for AI thinking
  useEffect(() => {
    if (state.isTyping) {
      const interval = setInterval(() => {
        setState(prev => ({ ...prev, typingDots: (prev.typingDots + 1) % 4 }));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [state.isTyping]);

  // Processing time tracker and warning
  useEffect(() => {
    let processingInterval: NodeJS.Timeout;
    let warningTimeout: NodeJS.Timeout;
    
    if (state.isTyping) {
      setState(prev => ({ ...prev, processingTime: 0, showLongProcessingWarning: false }));
      
      processingInterval = setInterval(() => {
        setState(prev => ({ ...prev, processingTime: prev.processingTime + 1 }));
      }, 1000);
      
      warningTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, showLongProcessingWarning: true }));
      }, 30000);
    }
    
    return () => {
      if (processingInterval) clearInterval(processingInterval);
      if (warningTimeout) clearTimeout(warningTimeout);
      if (!state.isTyping) {
        setState(prev => ({ ...prev, processingTime: 0, showLongProcessingWarning: false }));
      }
    };
  }, [state.isTyping]);

  // Typewriter animation for placeholder
  useEffect(() => {
    if (state.messages.length > 0 || inputValue.length > 0) {
      setState(prev => ({ ...prev, displayedText: '' }));
      return;
    }

    let isMounted = true;
    const currentQuery = placeholderQueries[state.placeholderIndex];
    let charIndex = 0;

    const typeNextChar = () => {
      if (!isMounted || charIndex >= currentQuery.length || inputValue.length > 0) {
        if (isMounted && inputValue.length === 0) {
          setTimeout(() => {
            if (isMounted && inputValue.length === 0) {
              setState(prev => ({
                ...prev,
                placeholderIndex: (prev.placeholderIndex + 1) % placeholderQueries.length,
                displayedText: ''
              }));
            }
          }, 2000);
        }
        return;
      }

      setState(prev => ({ ...prev, displayedText: currentQuery.substring(0, charIndex + 1) }));
      charIndex++;
      setTimeout(typeNextChar, 100);
    };

    const startTimer = setTimeout(typeNextChar, 500);
    return () => {
      isMounted = false;
      clearTimeout(startTimer);
    };
  }, [state.placeholderIndex, inputValue, state.messages.length]);

  // ==================== COMPLETE MESSAGE HANDLERS ====================
  
  const handleSendMessage = useCallback(async (messageText: string) => {
    // Basic validation
    if (!messageText.trim()) {
      const errorMessage = uiHandler.createErrorMessage('Please enter a message');
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMessage] }));
      return;
    }

    if (state.showQuickSuggestions) {
      setState(prev => ({ ...prev, showQuickSuggestions: false }));
    }

    const userMessage = uiHandler.createUserMessage(messageText);
    setState(prev => ({ 
      ...prev, 
      messages: [...prev.messages, userMessage],
      isTyping: true,
      typingDots: 0
    }));
    
    setInputValue('');

    try {
      const conversationHistory = uiHandler.buildConversationHistory(state.messages);
      conversationHistory.push({ role: 'user', content: messageText });

      const response = await mcpClient.sendMessage(conversationHistory);
      const nexMessage = uiHandler.processResponse(response, messageText);
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, nexMessage],
        isTyping: false,
        typingDots: 0
      }));

    } catch (error) {
      const errorMessage = uiHandler.createErrorMessage(
        error instanceof Error ? error.message : 'I encountered an issue processing your request. Please try again.'
      );
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        typingDots: 0
      }));
    }
  }, [state.messages, state.showQuickSuggestions, uiHandler, mcpClient]);

  // ==================== COMPLETE AUTH HANDLERS ====================
  
  const handleLogin = useCallback(async () => {
    if (!state.loginCredentials.username || !state.loginCredentials.password) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: 'Please enter both username and password.',
        sender: 'nex',
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMessage] }));
      return;
    }

    setState(prev => ({ ...prev, isLoggingIn: true }));
    
    try {
      const { UserService } = await import('@/services/userService');
      const result = await UserService.login(state.loginCredentials);
      
      if (result && result.token) {
        let realUserId: number;
        try {
          const tokenPayload = JSON.parse(atob(result.token.split('.')[1]));
          realUserId = tokenPayload.sub || result.userId;
        } catch {
          realUserId = result.userId;
        }

        const userData = await UserService.getUser(realUserId);
        
        useUserStore.getState().setSession({
          token: result.token,
          userId: realUserId,
          isAuthenticated: true,
          ...userData
        });
        
        // Load user's cart
        try {
          const { CartService } = await import('@/services/cartService');
          const { ProductService } = await import('@/services/productService');
          const userCart = await CartService.getUserCart(realUserId);
          
          if (userCart && userCart.products && userCart.products.length > 0) {
            const cartItemsPromises = userCart.products.map(async (item: any) => {
              try {
                const product = await ProductService.getProduct(item.productId);
                return {
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.image,
                  quantity: item.quantity
                };
              } catch {
                return null;
              }
            });
            
            const cartItems = await Promise.all(cartItemsPromises);
            const validCartItems = cartItems.filter(item => item !== null);
            
            if (validCartItems.length > 0) {
              useCartStore.getState().loadCartFromData(validCartItems, userCart.id);
              
              const cartLoadedMessage: ChatMessage = {
                id: `cart-loaded-${Date.now()}`,
                text: `I've restored ${validCartItems.length} item${validCartItems.length !== 1 ? 's' : ''} from your previous shopping session!`,
                sender: 'nex',
                timestamp: new Date()
              };
              setState(prev => ({ ...prev, messages: [...prev.messages, cartLoadedMessage] }));
            }
          }
        } catch (error) {
          console.error('Failed to load user cart:', error);
        }
        
        const successMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          text: `Welcome back, ${userData.name?.firstname || userData.username}!`,
          sender: 'nex',
          timestamp: new Date()
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, successMessage] }));
        
        // Execute pending action
        if (state.pendingAction) {
          if (state.pendingAction.type === 'cart') {
            const cartSuccess = await addToCart(state.pendingAction.product);
            if (cartSuccess) {
              const cartMessage: ChatMessage = {
                id: `cart-post-login-${Date.now()}`,
                text: `Great! I've added "${state.pendingAction.product.title}" to your cart.`,
                sender: 'nex',
                timestamp: new Date(),
                showCartButton: true
              };
              setState(prev => ({ ...prev, messages: [...prev.messages, cartMessage] }));
              toast.success('Added to cart!');
            }
          } else if (state.pendingAction.type === 'wishlist') {
            const wishlistSuccess = await addToWishlist(state.pendingAction.product);
            if (wishlistSuccess) {
              const wishlistMessage: ChatMessage = {
                id: `wishlist-post-login-${Date.now()}`,
                text: `Perfect! I've saved "${state.pendingAction.product.title}" to your wishlist.`,
                sender: 'nex',
                timestamp: new Date(),
                showWishlistButton: true
              };
              setState(prev => ({ ...prev, messages: [...prev.messages, wishlistMessage] }));
              toast.success('Added to wishlist!');
            }
          }
          setState(prev => ({ ...prev, pendingAction: null }));
        }
        
        setState(prev => ({
          ...prev,
          showLoginForm: false,
          loginCredentials: { username: '', password: '' }
        }));
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: 'Login failed. Please check your credentials and try again.',
        sender: 'nex',
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, errorMessage] }));
    }
    
    setState(prev => ({ ...prev, isLoggingIn: false }));
  }, [state.loginCredentials, state.pendingAction, addToCart, addToWishlist]);

  // ==================== COMPLETE ACTION HANDLERS ====================
  
  const handleConfirmAction = useCallback((messageId: string, confirmed: boolean) => {
    const message = state.messages.find(m => m.id === messageId);
    if (!message || !message.pendingAction) return;

    if (confirmed) {
      const userActionMessage = uiHandler.createUserMessage('Okay, proceed!');
      setState(prev => ({ ...prev, messages: [...prev.messages, userActionMessage] }));

      if (!isAuthenticated) {
        const authMessage: ChatMessage = {
          id: `auth-required-${Date.now()}`,
          text: 'Sorry, Please log in to add items to your cart or wishlist.',
          sender: 'nex',
          timestamp: new Date()
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, authMessage] }));
        
        if (message.products && message.products.length > 0) {
          const actionType = message.pendingAction?.type;
          setState(prev => ({
            ...prev,
            pendingAction: { 
              type: actionType?.includes('cart') ? 'cart' : 'wishlist', 
              product: message.products![0]
            },
            showLoginForm: true
          }));
        }
        return;
      }

      uiHandler.executeConfirmedAction(message.pendingAction, message.products);
      
      const actionType = message.pendingAction?.type;
      const productCount = message.products?.length || 0;
      
      if (actionType === 'cart.add') {
        setCartOpen(true);
        toast.success(`Added ${productCount} item${productCount !== 1 ? 's' : ''} to cart!`, { duration: 2000 });
        
        const successText = productCount === 1 
          ? `Awesome! I've added it to your cart. Ready to checkout?` 
          : `Great! I've added all ${productCount} items to your cart. You're all set!`;
        
        const nexSuccessMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          text: successText,
          sender: 'nex',
          timestamp: new Date(),
          showCartButton: true
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, nexSuccessMessage] }));
        
      } else if (actionType === 'wishlist.add') {
        setWishlistOpen(true);
        toast.success(`Added ${productCount} item${productCount !== 1 ? 's' : ''} to wishlist!`, { duration: 2000 });
        
        const successText = productCount === 1 
          ? `Perfect! I've saved it to your wishlist for later.` 
          : `Excellent! I've saved all ${productCount} items to your wishlist.`;
        
        const nexSuccessMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          text: successText,
          sender: 'nex',
          timestamp: new Date(),
          showWishlistButton: true
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, nexSuccessMessage] }));
      }
    } else {
      const userCancelMessage = uiHandler.createUserMessage('No thanks, maybe later.');
      const nexCancelMessage = uiHandler.createMessage('No worries at all! Let me know if you\'d like to explore other options.', 'nex');
      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, userCancelMessage, nexCancelMessage] 
      }));
    }

    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => 
        m.id === messageId 
          ? { ...m, awaitingConfirmation: false, pendingAction: undefined }
          : m
      )
    }));
  }, [state.messages, isAuthenticated, uiHandler, setCartOpen, setWishlistOpen]);

  // ==================== PAGINATION HANDLERS ====================
  
  const handlePreviousPage = useCallback((messageIndex: number) => {
    setState(prev => {
      const newPagination = new Map(prev.messagePagination);
      const currentPage = newPagination.get(messageIndex) || 1;
      if (currentPage > 1) {
        newPagination.set(messageIndex, currentPage - 1);
      }
      return { ...prev, messagePagination: newPagination };
    });
  }, []);

  const handleNextPage = useCallback((messageIndex: number) => {
    setState(prev => {
      const newPagination = new Map(prev.messagePagination);
      const currentPage = newPagination.get(messageIndex) || 1;
      const message = prev.messages[messageIndex];
      if (message && message.products) {
        const totalPages = Math.ceil(message.products.length / 3); // Match productsPerPage
        if (currentPage < totalPages) {
          newPagination.set(messageIndex, currentPage + 1);
        }
      }
      return { ...prev, messagePagination: newPagination };
    });
  }, []);

  // ==================== UTILITY HANDLERS ====================
  
  const handleQuickSuggestion = useCallback((suggestion: typeof quickSearchSuggestions[0]) => {
    const processedText = uiHandler.processQuickSuggestion(suggestion.text);
    handleSendMessage(processedText);
  }, [handleSendMessage, uiHandler]);

  const handleReset = useCallback(() => {
    setState({
      messages: [],
      isTyping: false,
      placeholderIndex: 0,
      displayedText: '',
      showQuickSuggestions: true,
      typingDots: 0,
      processingTime: 0,
      showLongProcessingWarning: false,
      messagePagination: new Map(),
      showLoginForm: false,
      loginCredentials: { username: '', password: '' },
      isLoggingIn: false,
      pendingAction: null
    });
    setInputValue('');
  }, []);

  // ==================== LOADING STATE HELPER ====================
  const getCurrentLoadingState = (time: number) => {
    return nexAssistantConfig.loadingStates.find(stateConfig => 
      time >= stateConfig.timeRange.min && time < stateConfig.timeRange.max
    ) || nexAssistantConfig.loadingStates[nexAssistantConfig.loadingStates.length - 1];
  };

  // ==================== COMPLETE MESSAGE RENDERING ====================

  // ==================== COMPLETE MESSAGE RENDERING ====================
  const renderMessage = (message: ChatMessage, messageIndex: number) => {
    const currentPage = state.messagePagination.get(messageIndex) || 1;
    const productsPerPage = 3; // Match DraggableNexAssistant
    
    return (
      <motion.div
        key={message.id}
        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className={`max-w-[80%] p-3 rounded-lg shadow-md ${
            message.sender === 'user'
              ? 'text-white ml-auto'
              : 'bg-slate-100 text-slate-900'
          }`}
          style={message.sender === 'user' ? { background: 'var(--brand-gradient)' } : {}}
        >
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          
          {/* Inline Login Form */}
          {state.showLoginForm && (message.text.includes('You\'re not signed in!') || message.text.includes('Please log in to add items')) && message.sender === 'nex' && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="space-y-3">
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Login</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Demo credentials: <br />
                    <button 
                      className="font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                      onClick={() => setState(prev => ({
                        ...prev,
                        loginCredentials: { username: 'kevinryan', password: 'kev02937@' }
                      }))}
                    >
                      kevinryan / kev02937@ (click to use)
                    </button>
                  </p>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={state.loginCredentials.username}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      loginCredentials: { ...prev.loginCredentials, username: e.target.value }
                    }))}
                    className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={state.loginCredentials.password}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      loginCredentials: { ...prev.loginCredentials, password: e.target.value }
                    }))}
                    className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="btn-primary h-7 px-3 text-xs flex-1"
                    onClick={handleLogin}
                    disabled={state.isLoggingIn}
                  >
                    {state.isLoggingIn ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button
                    size="sm"
                    className="btn-ghost h-7 px-3 text-xs"
                    onClick={() => setState(prev => ({
                      ...prev,
                      showLoginForm: false,
                      loginCredentials: { username: '', password: '' },
                      pendingAction: null
                    }))}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* View Cart Button */}
          {message.showCartButton && message.sender === 'nex' && (
            <div className="mt-4 flex justify-center">
              <Button
                size="sm"
                className="btn-primary h-8 px-4 text-xs font-medium"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                View Cart
              </Button>
            </div>
          )}
          
          {/* View Wishlist Button */}
          {message.showWishlistButton && message.sender === 'nex' && (
            <div className="mt-4 flex justify-center">
              <Button
                size="sm"
                className="btn-secondary h-8 px-4 text-xs font-medium"
                onClick={() => setWishlistOpen(true)}
              >
                <Heart className="w-3 h-3 mr-1" />
                View Wishlist
              </Button>
            </div>
          )}
          
          {/* Product Cards with Pagination */}
          {message.products && message.products.length > 0 && (
            <div className="mt-4">
              <div className="space-y-3">
                {message.products
                  .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                  .map((product) => (
                    <motion.div
                      key={product.id}
                      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-100"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight">
                              {product.title}
                            </h4>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-base font-bold text-emerald-600">
                                £{product.price.toFixed(2)}
                              </p>
                              {product.rating && (
                                <div className="flex items-center text-xs">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-gray-600 ml-1 font-medium">{product.rating.rate}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Full width button row */}
                        <div className="flex gap-2 items-center w-full">
                          <Button
                            size="sm"
                            className="btn-primary h-7 px-3 text-xs flex-1 min-w-0"
                            onClick={() => {
                              if (isAuthenticated) {
                                addToCart(product);
                                toast.success('Added to cart!');
                              } else {
                                setState(prev => ({
                                  ...prev,
                                  pendingAction: { type: 'cart', product },
                                  showLoginForm: true
                                }));
                                const authMessage: ChatMessage = {
                                  id: `auth-required-${Date.now()}`,
                                  text: 'You\'re not signed in! Please log in to add items to your cart.',
                                  sender: 'nex',
                                  timestamp: new Date()
                                };
                                setState(prev => ({ ...prev, messages: [...prev.messages, authMessage] }));
                              }
                            }}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">Add to Cart</span>
                          </Button>
                          <Button
                            size="sm"
                            className="btn-secondary h-7 w-7 p-0 flex-shrink-0 flex items-center justify-center"
                            onClick={() => {
                              if (isAuthenticated) {
                                addToWishlist(product);
                                toast.success('Added to wishlist!');
                              } else {
                                setState(prev => ({
                                  ...prev,
                                  pendingAction: { type: 'wishlist', product },
                                  showLoginForm: true
                                }));
                                const authMessage: ChatMessage = {
                                  id: `auth-required-${Date.now()}`,
                                  text: 'You\'re not signed in! Please log in to add items to your wishlist.',
                                  sender: 'nex',
                                  timestamp: new Date()
                                };
                                setState(prev => ({ ...prev, messages: [...prev.messages, authMessage] }));
                              }
                            }}
                            title="Add to Wishlist"
                          >
                            <Heart className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="btn-ghost h-7 w-7 p-0 flex-shrink-0 flex items-center justify-center"
                            onClick={() => router.push(`/products/${product.id}`)}
                            title="View Details"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* Enhanced Pagination Controls */}
              {message.products.length > productsPerPage && (
                <div className="border-t border-gray-100 pt-3 mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                    <span>Showing {((currentPage - 1) * productsPerPage) + 1}-{Math.min(currentPage * productsPerPage, message.products.length)} of {message.products.length} products</span>
                    <span>Page {currentPage} of {Math.ceil(message.products.length / productsPerPage)}</span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      className={`btn-secondary h-7 px-3 text-xs ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={currentPage <= 1}
                      onClick={() => handlePreviousPage(messageIndex)}
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      className={`btn-secondary h-7 px-3 text-xs ${currentPage >= Math.ceil(message.products.length / productsPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={currentPage >= Math.ceil(message.products.length / productsPerPage)}
                      onClick={() => handleNextPage(messageIndex)}
                    >
                      Next
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Confirmation Buttons */}
          {message.awaitingConfirmation && message.pendingAction && message.sender === 'nex' && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-center">
                <p className="text-sm text-amber-800 mb-3 font-medium">
                  Would you like me to add the above listed product(s) to your {message.pendingAction.type?.includes('cart') ? 'cart' : 'wishlist'}?
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    className="btn-success h-8 px-4 text-xs font-medium"
                    onClick={() => handleConfirmAction(message.id, true)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Proceed
                  </Button>
                  <Button
                    size="sm" 
                    className="btn-secondary h-8 px-4 text-xs"
                    onClick={() => handleConfirmAction(message.id, false)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <span className="text-xs opacity-70 mt-1 block">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </motion.div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <AssistantShell
      isExpanded={isExpanded}
      isProcessing={state.isTyping}
      position={position}
      config={shellConfig}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onToggleExpanded={onToggleExpanded}
      onReset={handleReset}
      onSendMessage={handleSendMessage}
      onDrag={onPositionChange}
    >
      <ScrollArea className="flex-1 px-6 py-4 scrollbar-thin">
        {state.messages.length === 0 ? (
            // Welcome Section with Quick Suggestions
            <div className="space-y-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-800, #1e40af)' }}>
                  {nexAssistantConfig.welcomeTitle}
                </h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {nexAssistantConfig.welcomeDescription}
                </p>
              </div>

              {/* Quick Search Suggestions */}
              {state.showQuickSuggestions && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full mr-3" style={{ backgroundColor: 'var(--brand-500, #3b82f6)' }}></span>
                    {nexAssistantConfig.quickSuggestionsTitle}
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {quickSearchSuggestions.map((suggestion, index) => {
                      const IconComponent = suggestion.icon;
                      return (
                        <motion.button
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                          onClick={() => handleQuickSuggestion(suggestion)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <IconComponent className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-800 font-medium mb-1">
                              {suggestion.text.replace('Ask: ', '').replace('Try: ', '').replace('Find ', '')}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {suggestion.category}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Messages
            <div className="space-y-4">
              <AnimatePresence>
                {state.messages.map((message, index) => renderMessage(message, index))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {state.isTyping && (
                <motion.div
                  className="flex items-start space-x-3 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback style={{ background: 'linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%)' }}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="bg-slate-50 rounded-2xl px-4 py-3 max-w-[80%]">
                    <div className="space-y-3">
                      {/* Loading State Message */}
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-slate-600">
                          Nex is analyzing
                        </p>
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: 'var(--brand-500, #3b82f6)' }}
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: 'var(--brand-500, #3b82f6)' }}
                          />
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: 'var(--brand-500, #3b82f6)' }}
                          />
                        </div>
                      </div>
                      
                      {/* Long Processing Warning */}
                      {state.showLongProcessingWarning && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gradient, linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%))' }}>
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-xs font-medium" style={{ color: 'var(--brand-700, #1d4ed8)' }}>
                              {nexAssistantConfig.loadingMessages.longProcessingTitle}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {nexAssistantConfig.loadingMessages.longProcessingMessage}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'var(--brand-400, #60a5fa)' }}
                          />
                          <span className="text-xs text-slate-500">
                            {getCurrentLoadingState(state.processingTime).message}
                          </span>
                        </div>
                        {state.processingTime < 60 && (
                          <div className="flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {nexAssistantConfig.loadingMessages.maxTimeMessage}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
      </ScrollArea>
    </AssistantShell>
  );
};
