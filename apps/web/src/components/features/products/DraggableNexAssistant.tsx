'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  User, 
  Mic, 
  Image, 
  Send,
  MessageCircle,
  ShoppingCart,
  Heart,
  X,
  Search,
  RotateCcw,
  Plus,
  ArrowUp,
  Check,
  Star,
  Zap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DraggableNexAssistant() {
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();
  
  // SINGLE SOURCE OF TRUTH for authentication - UserStore only
  const { session: user, isAuthenticated: isAuthenticatedFn } = useUserStore();
  const isAuthenticated = isAuthenticatedFn();
  
  const { setCartOpen, setWishlistOpen } = useUIStore();
  const router = useRouter();
  
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isOnLeft, setIsOnLeft] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);
  const [typingDots, setTypingDots] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [showLongProcessingWarning, setShowLongProcessingWarning] = useState(false);
  
  // Pagination state - track current page for each message with products
  const [messagePagination, setMessagePagination] = useState<Map<number, number>>(new Map());
  
  // Clean up pagination state when messages change
  useEffect(() => {
    setMessagePagination(prev => {
      const newPagination = new Map(prev);
      
      // Remove pagination entries for messages that no longer exist or don't have products
      for (const [messageIndex] of prev) {
        if (messageIndex >= messages.length || !messages[messageIndex]?.products?.length) {
          newPagination.delete(messageIndex);
        }
      }
      
      return newPagination;
    });
  }, [messages.length]); // Only run when the number of messages changes
  
  // Login state for inline authentication
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'cart' | 'wishlist', product: Product } | null>(null);
  
  // Initialize UI handler
  const uiHandler = new AIAssistantUIHandler({
    onNavigate: (payload) => {
      if (payload.page) {
        router.push(payload.page);
        // Don't auto-close chat - let user decide when to close it
      }
    },
    onProductAction: (action, product) => {
      if (!user) {
        // Let Nex handle the error message internally
        const errorMessage = uiHandler.createErrorMessage('Please log in to add items to your cart or wishlist.');
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      // Execute the action
      if (action === 'add_to_cart') {
        addToCart(product);
      } else if (action === 'add_to_wishlist') {
        addToWishlist(product);
      }
    },
    onUIAction: (action, products) => {
      // Handle UI-only actions like view cart, view wishlist, etc.
      console.log('UI Action:', action, products);
    },
    onAuthAction: (action) => {
      if (action === 'login') {
        setShowLoginForm(true);
      } else if (action === 'logout') {
        // Handle logout
        console.log('Logout requested');
      }
    },
    onError: (error) => {
      // Handle errors internally through Nex instead of toast
      const errorMessage = uiHandler.createErrorMessage(error);
      setMessages(prev => [...prev, errorMessage]);
    }
  });
  
  // Use configuration-based suggestions
  const quickSearchSuggestions = nexAssistantConfig.quickSuggestions;

  // Use configuration-based placeholder queries
  const placeholderQueries = nexAssistantConfig.placeholderQueries;
  
  // Helper function to get current loading state
  const getCurrentLoadingState = (time: number) => {
    return nexAssistantConfig.loadingStates.find(state => 
      time >= state.timeRange.min && time < state.timeRange.max
    ) || nexAssistantConfig.loadingStates[nexAssistantConfig.loadingStates.length - 1];
  };
  
  const mcpClient = createMcpClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize position after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Animated typing dots for AI thinking
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setTypingDots(prev => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  // Processing time tracker and long processing warning
  useEffect(() => {
    let processingInterval: NodeJS.Timeout;
    let warningTimeout: NodeJS.Timeout;
    
    if (isTyping) {
      setProcessingTime(0);
      setShowLongProcessingWarning(false);
      
      // Update processing time every second
      processingInterval = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);
      
      // Show warning after 30 seconds
      warningTimeout = setTimeout(() => {
        setShowLongProcessingWarning(true);
      }, 30000);
    }
    
    return () => {
      if (processingInterval) clearInterval(processingInterval);
      if (warningTimeout) clearTimeout(warningTimeout);
      if (!isTyping) {
        setProcessingTime(0);
        setShowLongProcessingWarning(false);
      }
    };
  }, [isTyping]);

  // Simplified typewriter animation
  useEffect(() => {
    // Stop animation immediately if user types or there are messages
    if (messages.length > 0 || inputText.length > 0) {
      setDisplayedText('');
      return;
    }

    let isMounted = true;
    const currentQuery = placeholderQueries[placeholderIndex];
    let charIndex = 0;

    const typeNextChar = () => {
      // Double-check conditions before each character
      if (!isMounted || charIndex >= currentQuery.length || inputText.length > 0) {
        if (isMounted && inputText.length === 0) {
          // Wait 2 seconds then switch to next query
          setTimeout(() => {
            if (isMounted && inputText.length === 0) {
              setPlaceholderIndex((prev) => (prev + 1) % placeholderQueries.length);
              setDisplayedText('');
            }
          }, 2000);
        }
        return;
      }

      setDisplayedText(currentQuery.substring(0, charIndex + 1));
      charIndex++;
      
      setTimeout(typeNextChar, 100);
    };

    // Start typing after brief delay
    const startTimer = setTimeout(typeNextChar, 500);

    return () => {
      isMounted = false;
      clearTimeout(startTimer);
    };
  }, [placeholderIndex, inputText, messages.length]);

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.w-14')) {
      setIsDragging(true);
      setHasDragged(false);
      
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;
      
      const handleMouseMove = (e: MouseEvent) => {
        setHasDragged(true);
        const newX = Math.max(0, Math.min(window.innerWidth - 56, e.clientX - startX));
        const newY = Math.max(0, Math.min(window.innerHeight - 56, e.clientY - startY));
        
        setPosition({ x: newX, y: newY });
        setIsOnLeft(newX < window.innerWidth / 2);
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleToggle = () => {
    if (!hasDragged) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowQuickSuggestions(true);
    setInputText('');
    setIsTyping(false);
    setPlaceholderIndex(0);
    setDisplayedText('');
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      // Set pending action and show authentication prompt in chat
      setPendingAction({ type: 'cart', product });
      showAuthenticationPrompt('add items to your cart');
      return;
    }
    
    // User is authenticated - add to cart directly through UI store
    const success = await addToCart(product);
    if (success) {
      const successMessage: ChatMessage = {
        id: `cart-success-${Date.now()}`,
        text: `Awesome! I've added "${product.title}" to your cart. Ready to checkout?`,
        sender: 'nex',
        timestamp: new Date(),
        showCartButton: true
      };
      setMessages(prev => [...prev, successMessage]);
      toast.success('Added to cart!');
    }
  };

  const handleAddToWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      // Set pending action and show authentication prompt in chat
      setPendingAction({ type: 'wishlist', product });
      showAuthenticationPrompt('add items to your wishlist');
      return;
    }
    
    // User is authenticated - add to wishlist directly through UI store
    const success = await addToWishlist(product);
    if (success) {
      const successMessage: ChatMessage = {
        id: `wishlist-success-${Date.now()}`,
        text: `Perfect! I've saved "${product.title}" to your wishlist for later.`,
        sender: 'nex',
        timestamp: new Date(),
        showWishlistButton: true
      };
      setMessages(prev => [...prev, successMessage]);
      toast.success('Added to wishlist!');
    }
  };

  // Show authentication prompt in chat
  const showAuthenticationPrompt = (action: string) => {
    const loginPromptMessage: ChatMessage = {
      id: `auth-prompt-${Date.now()}`,
      text: `You're not signed in! Please log in to ${action}.`,
      sender: 'nex',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loginPromptMessage]);
    setShowLoginForm(true);
  };

  // Handle login form submission
  const handleLogin = async () => {
    if (!loginCredentials.username || !loginCredentials.password) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: 'Please enter both username and password.',
        sender: 'nex',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // Import UserService to login via chat
      const { UserService } = await import('@/services/userService');
      const result = await UserService.login({
        username: loginCredentials.username,
        password: loginCredentials.password
      });
      
      if (result && result.token) {
        // Decode JWT token to get user ID
        let realUserId: number;
        try {
          const tokenPayload = JSON.parse(atob(result.token.split('.')[1]));
          realUserId = tokenPayload.sub || result.userId;
        } catch {
          realUserId = result.userId;
        }

        // Get full user data
        const userData = await UserService.getUser(realUserId);
        
        // Update UserStore with the authenticated session
        const { useUserStore } = await import('@/lib/store');
        useUserStore.getState().setSession({
          token: result.token,
          userId: realUserId,
          isAuthenticated: true,
          ...userData
        });
        
        // **CRITICAL**: Load user's cart data from backend and sync with local cart
        try {
          const { CartService } = await import('@/services/cartService');
          const { ProductService } = await import('@/services/productService');
          const userCart = await CartService.getUserCart(realUserId);
          
          // Check if user has cart data on backend
          if (userCart && userCart.products && userCart.products.length > 0) {
            // Fetch full product details for each cart item
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
              } catch (error) {
                console.error(`Failed to fetch product ${item.productId}:`, error);
                return null;
              }
            });
            
            const cartItems = await Promise.all(cartItemsPromises);
            const validCartItems = cartItems.filter(item => item !== null);
            
            if (validCartItems.length > 0) {
              // Load cart data into the store
              const { useCartStore } = await import('@/lib/store');
              useCartStore.getState().loadCartFromData(validCartItems, userCart.id);
              
              // Show cart loaded message
              const cartLoadedMessage: ChatMessage = {
                id: `cart-loaded-${Date.now()}`,
                text: `I've restored ${validCartItems.length} item${validCartItems.length !== 1 ? 's' : ''} from your previous shopping session!`,
                sender: 'nex',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, cartLoadedMessage]);
            }
          }
        } catch (error) {
          console.error('Failed to load user cart:', error);
          // Don't fail login if cart loading fails
        }
        
        const successMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          text: `Welcome back, ${userData.name?.firstname || userData.username}!`,
          sender: 'nex',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Execute pending action
        if (pendingAction) {
          if (pendingAction.type === 'cart') {
            const cartSuccess = await addToCart(pendingAction.product);
            if (cartSuccess) {
              const cartMessage: ChatMessage = {
                id: `cart-post-login-${Date.now()}`,
                text: `Great! I've added "${pendingAction.product.title}" to your cart.`,
                sender: 'nex',
                timestamp: new Date(),
                showCartButton: true
              };
              setMessages(prev => [...prev, cartMessage]);
              toast.success('Added to cart!');
            }
          } else if (pendingAction.type === 'wishlist') {
            const wishlistSuccess = await addToWishlist(pendingAction.product);
            if (wishlistSuccess) {
              const wishlistMessage: ChatMessage = {
                id: `wishlist-post-login-${Date.now()}`,
                text: `Perfect! I've saved "${pendingAction.product.title}" to your wishlist.`,
                sender: 'nex',
                timestamp: new Date(),
                showWishlistButton: true
              };
              setMessages(prev => [...prev, wishlistMessage]);
              toast.success('Added to wishlist!');
            }
          }
          setPendingAction(null);
        }
        
        setShowLoginForm(false);
        setLoginCredentials({ username: '', password: '' });
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
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoggingIn(false);
  };

  const handleCancelLogin = () => {
    setShowLoginForm(false);
    setLoginCredentials({ username: '', password: '' });
    setPendingAction(null);
    
    const cancelMessage: ChatMessage = {
      id: `cancel-${Date.now()}`,
      text: 'Login cancelled. You can try again anytime!',
      sender: 'nex',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  // Pagination handlers
  const handlePreviousPage = (messageIndex: number) => {
    setMessagePagination(prev => {
      const newMap = new Map(prev);
      const currentPage = newMap.get(messageIndex) || 1;
      if (currentPage > 1) {
        newMap.set(messageIndex, currentPage - 1);
      }
      return newMap;
    });
  };

  const handleNextPage = (messageIndex: number) => {
    setMessagePagination(prev => {
      const newMap = new Map(prev);
      const currentPage = newMap.get(messageIndex) || 1;
      newMap.set(messageIndex, currentPage + 1);
      return newMap;
    });
  };

  const getCurrentPageProducts = (products: Product[], messageIndex: number) => {
    const currentPage = messagePagination.get(messageIndex) || 1;
    const startIndex = (currentPage - 1) * 3;
    const endIndex = startIndex + 3;
    return products.slice(startIndex, endIndex);
  };

  const handleSendMessage = async (overrideText?: string) => {
    const messageText = overrideText || inputText.trim();
    
    // Validate message
    const validation = uiHandler.validateMessage(messageText);
    if (!validation.valid) {
      // Handle validation error internally through Nex
      const errorMessage = uiHandler.createErrorMessage(validation.error || 'Please enter a message');
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Hide quick suggestions after first message
    if (showQuickSuggestions) {
      setShowQuickSuggestions(false);
    }

    // Create user message
    const userMessage = uiHandler.createUserMessage(messageText);
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setTypingDots(0);

    try {
      // Build conversation history
      const conversationHistory = uiHandler.buildConversationHistory(messages);
      conversationHistory.push({ role: 'user', content: messageText });

      // Send message to backend with progress tracking
      const response = await mcpClient.sendMessage(
        conversationHistory, 
        undefined,
        (progressInfo) => {
          // Progress is automatically handled by our useEffect hooks above
          console.log(`[AI Progress] ${progressInfo.stage}: ${progressInfo.message} (${Math.round(progressInfo.timeElapsed/1000)}s)`);
        }
      );
      
      // Process response using UI handler
      const assistantMessage = uiHandler.processResponse(response, messageText);
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        
        // Reset pagination to page 1 for new product search results
        if (assistantMessage.products && assistantMessage.products.length > 0) {
          const messageIndex = newMessages.length - 1;
          setMessagePagination(paginationPrev => {
            const newPagination = new Map(paginationPrev);
            newPagination.set(messageIndex, 1); // Always start at page 1 for new queries
            return newPagination;
          });
        }
        
        return newMessages;
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Error handling is now done by the HTTP service with user-friendly messages
      const errorMessage = uiHandler.createErrorMessage(
        error instanceof Error ? error.message : 'I encountered an issue processing your request. Let me try a different approach or please rephrase your question.'
      );
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTypingDots(0);
    }
  };

  // Handle quick search suggestions
  const handleQuickSuggestion = (suggestion: typeof quickSearchSuggestions[0]) => {
    const processedText = uiHandler.processQuickSuggestion(suggestion.text);
    handleSendMessage(processedText);
  };

  // Generic function to handle post-action UI (drawer + toast)
  const handlePostActionUI = (actionType: 'cart' | 'wishlist', productCount: number) => {
    if (actionType === 'cart') {
      setCartOpen(true);
      toast.success(`Added ${productCount} item${productCount !== 1 ? 's' : ''} to cart!`, {
        duration: 2000
      });
    } else {
      setWishlistOpen(true);
      toast.success(`Added ${productCount} item${productCount !== 1 ? 's' : ''} to wishlist!`, {
        duration: 2000
      });
    }
  };

  // Handle confirmation actions (Proceed/Cancel buttons)
  const handleConfirmAction = (messageId: string, confirmed: boolean) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.pendingAction) return;

    if (confirmed) {
      // Add user's action message with better text
      const userActionMessage = uiHandler.createUserMessage('Okay, proceed!');
      setMessages(prev => [...prev, userActionMessage]);

      // **CRITICAL FIX**: Check authentication before proceeding
      if (!isAuthenticated) {
        // User is not authenticated - show login prompt
        const authMessage: ChatMessage = {
          id: `auth-required-${Date.now()}`,
          text: 'Sorry, Please log in to add items to your cart or wishlist.',
          sender: 'nex',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, authMessage]);
        
        // Set pending action for after login and show login form
        if (message.products && message.products.length > 0) {
          const actionType = message.pendingAction?.type;
          setPendingAction({ 
            type: actionType?.includes('cart') ? 'cart' : 'wishlist', 
            product: message.products[0] // Take first product for now
          });
        }
        setShowLoginForm(true);
        return;
      }

      // User is authenticated - execute the confirmed action with products from the same message
      uiHandler.executeConfirmedAction(message.pendingAction, message.products);
      
      // Get action details for UI handling
      const actionType = message.pendingAction?.type;
      const productCount = message.products?.length || 0;
      
      // Handle UI (drawer + toast)
      if (actionType === 'cart.add') {
        handlePostActionUI('cart', productCount);
      } else if (actionType === 'wishlist.add') {
        handlePostActionUI('wishlist', productCount);
      }
      
      // Add enthusiastic Nex success message with view button (immediate)
      let successText = '';
      let showCartButton = false;
      let showWishlistButton = false;

      if (actionType === 'cart.add') {
        successText = productCount === 1 
          ? `Awesome! I've added it to your cart. Ready to checkout?` 
          : `Great! I've added all ${productCount} items to your cart. You're all set!`;
        showCartButton = true;
      } else if (actionType === 'wishlist.add') {
        successText = productCount === 1
          ? `Perfect! I've saved it to your wishlist for later.`
          : `Fantastic! I've added all ${productCount} items to your wishlist. Great choices!`;
        showWishlistButton = true;
      } else {
        successText = 'Done! Everything looks good.';
      }

      const successMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: successText,
        sender: 'nex',
        timestamp: new Date(),
        showCartButton: showCartButton,
        showWishlistButton: showWishlistButton
      };
      setMessages(prev => [...prev, successMessage]);
    } else {
      // Add user's cancellation message with better text
      const userCancelMessage = uiHandler.createUserMessage('No, cancel that');
      setMessages(prev => [...prev, userCancelMessage]);
      
      // Add friendly Nex cancellation acknowledgment (immediate)
      const nexCancelMessage = uiHandler.createMessage('No worries at all! Let me know if you\'d like to explore other options.', 'nex');
      setMessages(prev => [...prev, nexCancelMessage]);
    }

    // Update the message to remove the confirmation state
    setMessages(prev => 
      prev.map(m => 
        m.id === messageId 
          ? { ...m, awaitingConfirmation: false, pendingAction: undefined }
          : m
      )
    );
  };

  if (!isExpanded) {
    return (
      <motion.div
        className="fixed z-50 cursor-pointer"
        style={{ 
          left: position.x,
          top: position.y
        }}
        onMouseDown={handleMouseDown}
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 brand-glow" style={{ background: 'var(--brand-gradient)' }}>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: isOnLeft ? -400 : 400 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: isOnLeft ? -400 : 400 }}
          className="fixed z-50"
          style={{
            [isOnLeft ? 'left' : 'right']: 20,
            top: 75,
            bottom: 20,
            width: '22vw',
            minWidth: '340px',
            maxWidth: '400px'
          }}
        >
          <Card className="h-full flex flex-col shadow-2xl border-0 overflow-hidden bg-white">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: 'var(--brand-gradient)' }}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden pulse-brand" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="absolute inset-0 ai-shimmer"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Nex</h3>
                  <p className="text-xs text-white/80">Your Shopping Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                  title="Start New Chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full transition-all duration-200"
                  title="Minimize"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 px-6 py-4 scrollbar-thin">
                {messages.length === 0 ? (
                  // Show welcome section when no messages
                  <>
                    {/* Clean Welcome Section */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-800)' }}>{nexAssistantConfig.welcomeTitle}</h4>
                      <p className="text-slate-600 leading-relaxed">
                        {nexAssistantConfig.welcomeDescription}
                      </p>
                    </div>

                    {/* Quick Search Suggestions */}
                    {showQuickSuggestions && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full mr-3" style={{ backgroundColor: 'var(--brand-500)' }}></span>
                          {nexAssistantConfig.quickSuggestionsTitle}
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {quickSearchSuggestions.map((suggestion, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleQuickSuggestion(suggestion)}
                              className="flex items-center justify-between p-3 text-left bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all duration-200 w-full group hover:border-blue-200"
                            >
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors duration-200" style={{ backgroundColor: 'var(--brand-50)' }}>
                                  <suggestion.icon className="w-4 h-4" style={{ color: 'var(--brand-600)' }} />
                                </div>
                                <span className="text-sm font-medium text-slate-800">
                                  {suggestion.text}
                                </span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-slate-400 transition-colors duration-200" style={{ color: 'var(--brand-500)' }} />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Show messages when conversation has started
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender === "user"
                              ? "text-white ml-auto"
                              : "bg-slate-100 text-slate-900"
                          }`}
                          style={message.sender === "user" ? { background: 'var(--brand-gradient)' } : {}}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          
                          {/* Inline Login Form */}
                          {showLoginForm && (message.text.includes('You\'re not signed in!') || message.text.includes('Please log in to add items')) && message.sender === 'nex' && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                              <div className="space-y-3">
                                <div className="text-center">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Login</h4>
                                  <p className="text-xs text-gray-600 mb-2">
                                    Demo credentials: <br />
                                    <button 
                                      className="font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                                      onClick={() => setLoginCredentials({ username: 'kevinryan', password: 'kev02937@' })}
                                    >
                                      kevinryan / kev02937@ (click to use)
                                    </button>
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Input
                                    type="text"
                                    placeholder="Username"
                                    value={loginCredentials.username}
                                    onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
                                    className="h-8 text-xs border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                  />
                                  <Input
                                    type="password"
                                    placeholder="Password"
                                    value={loginCredentials.password}
                                    onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
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
                                    disabled={isLoggingIn}
                                  >
                                    {isLoggingIn ? 'Signing in...' : 'Sign In'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="btn-ghost h-7 px-3 text-xs"
                                    onClick={handleCancelLogin}
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
                          {message.products && message.products.length > 0 && (() => {
                            const messageIndex = index;
                            const currentPage = messagePagination.get(messageIndex) || 1;
                            const totalPages = Math.ceil(message.products.length / 3);
                            const currentPageProducts = getCurrentPageProducts(message.products, messageIndex);
                            const startIndex = (currentPage - 1) * 3 + 1;
                            const endIndex = Math.min(currentPage * 3, message.products.length);
                            
                            return (
                              <div className="mt-4 space-y-3">
                                {currentPageProducts.map((product) => (
                                  <motion.div 
                                    key={`${messageIndex}-${product.id}-${currentPage}`} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl p-3 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
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
                                              {product.displayPrice || `£${product.price}`}
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
                                      
                                      {/* Moved buttons to full width row below */}
                                      <div className="flex gap-2 items-center w-full">
                                        <Button
                                          size="sm"
                                          className="btn-primary h-7 px-3 text-xs flex-1 min-w-0"
                                          onClick={() => handleAddToCart(product)}
                                        >
                                          <ShoppingCart className="w-3 h-3 mr-1 flex-shrink-0" />
                                          <span className="truncate">Add to Cart</span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="btn-secondary h-7 w-7 p-0 flex-shrink-0 flex items-center justify-center"
                                          onClick={() => handleAddToWishlist(product)}
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
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                  <div className="border-t border-gray-100 pt-3 mt-4">
                                    <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                                      <span>Showing {startIndex}-{endIndex} of {message.products.length} products</span>
                                      <span>Page {currentPage} of {totalPages}</span>
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
                                        className={`btn-secondary h-7 px-3 text-xs ${currentPage >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={currentPage >= totalPages}
                                        onClick={() => handleNextPage(messageIndex)}
                                      >
                                        Next
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          
                          {/* Confirmation Buttons for UI Actions - Show AFTER products */}
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
                          
                          <span className="text-xs opacity-70 mt-1 block">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-100 text-slate-900 p-4 rounded-lg max-w-[80%] shadow-md" style={{ background: 'linear-gradient(135deg, var(--brand-100), var(--brand-50))' }}>
                          <div className="flex items-center space-x-3">
                            <motion.div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--brand-gradient)' }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-4 h-4 text-white" />
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium" style={{ color: 'var(--brand-700)' }}>
                                    Nex is analyzing
                                  </p>
                                  <div className="flex space-x-1">
                                    <motion.div
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                                      className="w-1 h-1 rounded-full"
                                      style={{ backgroundColor: 'var(--brand-500)' }}
                                    />
                                    <motion.div
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                                      className="w-1 h-1 rounded-full"
                                      style={{ backgroundColor: 'var(--brand-500)' }}
                                    />
                                    <motion.div
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                                      className="w-1 h-1 rounded-full"
                                      style={{ backgroundColor: 'var(--brand-500)' }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs text-slate-500 font-mono">
                                    {Math.floor(processingTime / 60)}:{String(processingTime % 60).padStart(2, '0')}
                                  </span>
                                </div>
                              </div>
                              
                              {showLongProcessingWarning && (
                                <div className="mb-3 p-3 rounded-lg border-0" style={{ 
                                  backgroundColor: 'var(--brand-25)',
                                  border: '1px solid var(--brand-200)'
                                }}>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gradient)' }}>
                                      <Sparkles className="w-3 h-3 text-white" />
                                    </div>
                                    <p className="text-xs font-medium" style={{ color: 'var(--brand-700)' }}>
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
                                    style={{ backgroundColor: 'var(--brand-400)' }}
                                  />
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: 'var(--brand-400)' }}
                                  />
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: 'var(--brand-400)' }}
                                  />
                                  <span className="text-xs font-medium text-slate-600">
                                    {getCurrentLoadingState(processingTime).message}
                                  </span>
                                </div>
                                {processingTime < 60 && (
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
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Modern Chat Input Area with Inline Icons */}
              <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200">
                <div className="space-y-3">
                  <div className="relative">
                    <div className="relative flex items-stretch bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 min-h-[3.5rem]">
                      {/* Left side icons - vertically centered */}
                      <div className="flex items-center pl-4 space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                          onClick={() => {
                            // Future voice functionality
                            const voiceMessage = uiHandler.createErrorMessage("Voice input is coming soon! For now, you can type your questions.");
                            setMessages(prev => [...prev, voiceMessage]);
                          }}
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                          onClick={() => {
                            // Future image functionality
                            const imageMessage = uiHandler.createErrorMessage("Image search is coming soon! Try describing what you're looking for instead.");
                            setMessages(prev => [...prev, imageMessage]);
                          }}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Textarea - larger and more comfortable */}
                      <div className="flex-1 relative">
                        <textarea
                          placeholder=""
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (inputText.trim() && !isTyping) {
                                handleSendMessage();
                              }
                            }
                          }}
                          className="w-full max-h-32 min-h-[3.5rem] py-4 px-3 bg-transparent border-none resize-none text-sm leading-relaxed focus:outline-none scrollbar-thin"
                          rows={1}
                          style={{ 
                            height: 'auto',
                            overflowY: inputText.split('\n').length > 2 ? 'auto' : 'hidden'
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.max(56, Math.min(target.scrollHeight, 120))}px`;
                          }}
                        />
                        
                        {/* Custom Animated Placeholder - Simplified */}
                        {!inputText && (
                          <div className="absolute inset-0 py-4 px-3 pointer-events-none flex items-center">
                            {messages.length === 0 ? (
                              // Animated placeholder for welcome screen
                              <div className="text-slate-400 text-sm">
                                <span>{displayedText}</span>
                                <span 
                                  className="ml-1 animate-pulse"
                                  style={{ color: 'var(--brand-500)' }}
                                >
                                  |
                                </span>
                              </div>
                            ) : (
                              // Simple fallback placeholder
                              <span className="text-slate-400 text-sm">
                                Type your message...
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Send button - vertically centered */}
                      <div className="flex items-center pr-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            onClick={() => handleSendMessage()}
                            disabled={!inputText.trim() || isTyping}
                            size="sm"
                            className={
                              inputText.trim() && !isTyping
                                ? "h-9 w-9 p-0 rounded-full transition-all duration-200 shadow-sm border-0"
                                : "h-9 w-9 p-0 rounded-full bg-slate-300 text-slate-500 cursor-not-allowed border-0"
                            }
                            style={
                              inputText.trim() && !isTyping
                                ? { 
                                    background: 'var(--brand-gradient)',
                                    color: 'white'
                                  }
                                : {}
                            }
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {/* Typing indicator */}
                    {inputText && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-16"
                      >
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--brand-500)' }}></div>
                      </motion.div>
                    )}
                  </div>

                  {/* Helper text below input */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4 text-slate-500">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: 'var(--brand-400)' }}></span>
                        Press Enter to send
                      </span>
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full mr-2 bg-slate-300"></span>
                        Shift + Enter for new line
                      </span>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
