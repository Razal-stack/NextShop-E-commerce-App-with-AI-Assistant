'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
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
  ArrowUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useCartStore, 
  useWishlistStore, 
  useUserStore
} from '@/lib/store';
import { Product } from '@/lib/types';
import { createMcpClient } from '@/lib/mcpClient';
import { AIAssistantUIHandler, ChatMessage } from '@/lib/aiAssistant/uiHandler';
import { useRouter } from 'next/navigation';

export default function DraggableNexAssistant() {
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();
  const { session } = useUserStore();
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
  
  // Initialize UI handler
  const uiHandler = new AIAssistantUIHandler({
    onNavigate: (payload) => {
      if (payload.page) {
        router.push(payload.page);
        // Don't auto-close chat - let user decide when to close it
      }
    },
    onProductAction: (action, product) => {
      if (!session) {
        // Let Nex handle the error message internally
        const errorMessage = uiHandler.createErrorMessage('Please log in to add items to your cart or wishlist.');
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      if (action === 'add_to_cart') {
        addToCart(product);
      } else if (action === 'add_to_wishlist') {
        addToWishlist(product);
      }
    },
    onError: (error) => {
      // Handle errors internally through Nex instead of toast
      const errorMessage = uiHandler.createErrorMessage(error);
      setMessages(prev => [...prev, errorMessage]);
    }
  });
  
  const quickSearchSuggestions = [
    { icon: Search, text: "Ask: 'Find electronics under £200'", category: "electronics" },
    { icon: ShoppingCart, text: "Ask: 'Show me trending clothes'", category: "clothing" },  
    { icon: Heart, text: "Ask: 'What are the best rated products?'", category: "popular" },
    { icon: Search, text: "Try: 'Find gifts for birthdays'", category: "gifts" },
    { icon: ShoppingCart, text: "Ask: 'Compare similar products for me'", category: "compare" },
    { icon: Heart, text: "Try: 'Show me 5-star electronics'", category: "ratings" }
  ];

  // Simplified placeholder queries for debugging
  const placeholderQueries = [
    "Hello! How can I help you?",
    "Find products under £200",
    "What are you looking for?",
    "Ask me anything!",
  ];
  
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

  const handleAddToCart = (product: Product) => {
    uiHandler.handleProductAction('add_to_cart', product);
  };

  const handleAddToWishlist = (product: Product) => {
    uiHandler.handleProductAction('add_to_wishlist', product);
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

      // Send message to backend
      const response = await mcpClient.sendMessage(conversationHistory);
      
      // Process response using UI handler
      const assistantMessage = uiHandler.processResponse(response, messageText);
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = uiHandler.createErrorMessage(
        'I encountered an issue processing your request. Let me try a different approach or please rephrase your question.'
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
                      <h4 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-800)' }}>Welcome! I'm Nex, Your Shopping Assistant</h4>
                      <p className="text-slate-600 leading-relaxed">
                        I'll help you find the perfect products within your budget and specifications. Let's discover something amazing together!
                      </p>
                    </div>

                    {/* Quick Search Suggestions */}
                    {showQuickSuggestions && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full mr-3" style={{ backgroundColor: 'var(--brand-500)' }}></span>
                          Quick searches to get you started
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
                    {messages.map((message) => (
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
                          
                          {/* Product Cards */}
                          {message.products && message.products.length > 0 && (
                            <div className="mt-4 space-y-3">
                              {message.products.slice(0, 3).map((product) => (
                                <motion.div 
                                  key={product.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                                >
                                  <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                      <img 
                                        src={product.image} 
                                        alt={product.title}
                                        className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
                                        {product.title}
                                      </h4>
                                      <div className="flex items-center gap-3 mb-3">
                                        <p className="text-lg font-bold text-emerald-600">
                                          {product.displayPrice || `£${product.price}`}
                                        </p>
                                        {product.rating && (
                                          <div className="flex items-center text-xs">
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="text-gray-600 ml-1 font-medium">{product.rating.rate}</span>
                                            <span className="text-gray-400 ml-1">({product.rating.count})</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="btn-primary h-8 px-3 text-xs flex-1"
                                          onClick={() => handleAddToCart(product)}
                                        >
                                          <ShoppingCart className="w-3 h-3 mr-1" />
                                          Add to Cart
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="btn-secondary h-8 px-2 text-xs"
                                          onClick={() => handleAddToWishlist(product)}
                                        >
                                          <Heart className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="btn-ghost h-8 px-2 text-xs"
                                          onClick={() => router.push(`/products/${product.id}`)}
                                          title="View Details"
                                        >
                                          <ChevronRight className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                              {message.totalFound && message.totalFound > 3 && (
                                <div className="text-center py-3 border-t border-gray-100 mt-4">
                                  <p className="text-xs text-slate-500 mb-2">
                                    Showing 3 of {message.totalFound} products
                                  </p>
                                  <Button
                                    size="sm"
                                    className="btn-secondary text-xs"
                                    onClick={() => {
                                      router.push('/products');
                                      // Don't auto-close the assistant to keep it available
                                    }}
                                  >
                                    View All {message.totalFound} Products
                                  </Button>
                                </div>
                              )}
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
                        <div className="bg-slate-100 text-slate-900 p-4 rounded-lg max-w-[80%] border" style={{ background: 'linear-gradient(135deg, var(--brand-50), white)' }}>
                          <div className="flex items-center space-x-3">
                            <motion.div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--brand-gradient)' }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="w-3 h-3 text-white" />
                            </motion.div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2" style={{ color: 'var(--brand-700)' }}>
                                Nex is thinking{'.'.repeat(typingDots + 1)}
                              </p>
                              <div className="flex items-center space-x-1">
                                <motion.div
                                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: 'var(--brand-400)' }}
                                />
                                <motion.div
                                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: 'var(--brand-400)' }}
                                />
                                <motion.div
                                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: 'var(--brand-400)' }}
                                />
                                <span className="text-xs text-slate-500 ml-2">Searching products</span>
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
                            const voiceMessage = uiHandler.createErrorMessage("🎤 Voice input is coming soon! For now, you can type your questions.");
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
                            const imageMessage = uiHandler.createErrorMessage("🖼️ Image search is coming soon! Try describing what you're looking for instead.");
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
                    
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center text-slate-600"
                        style={{ color: 'var(--brand-600)' }}
                      >
                        <div className="w-3 h-3 rounded-full mr-2 animate-pulse" style={{ backgroundColor: 'var(--brand-400)' }}></div>
                        Nex is thinking...
                      </motion.span>
                    )}
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
