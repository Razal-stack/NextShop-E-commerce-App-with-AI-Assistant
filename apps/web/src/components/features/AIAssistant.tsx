import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  Camera,
  History,
  Sparkles,
  ShoppingBag,
  Search,
  Heart,
  ShoppingCart,
  Star,
  ExternalLink,
  User,
  LogIn,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  useUIStore, 
  useCartStore, 
  useWishlistStore, 
  useUserStore, 
  useAuthStore,
  useChatHistoryStore
} from "@/lib/store";
import { Product } from "@/lib/types";
import { createMcpClient } from "../../../lib/mcpClient";
import { toast } from "sonner";
import { AuthModal } from "./auth/AuthModal";
import { ChatHistorySidebar } from "./chat/ChatHistorySidebar";

interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  products?: Product[];
  searchQuery?: string;
}

const AIAssistant: React.FC = () => {
  const { isAssistantOpen, setAssistantOpen } = useUIStore();
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist } = useWishlistStore();
  const { session } = useUserStore();
  const { 
    isAuthModalOpen, 
    setAuthModalOpen,
    authMode,
    setAuthMode
  } = useAuthStore();
  const {
    sessions,
    currentSessionId,
    isHistoryOpen,
    addSession,
    updateSession,
    loadSession,
    setCurrentSession,
    setHistoryOpen,
    generateSessionTitle
  } = useChatHistoryStore();

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [awaitingCredentials, setAwaitingCredentials] = useState(false);
  const [loginStep, setLoginStep] = useState<'username' | 'password' | null>(null);
  const [tempUsername, setTempUsername] = useState('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  
  const suggestions = [
    { icon: Search, text: "Find trending electronics" },
    { icon: ShoppingBag, text: "Show me fashion deals" },
    { icon: Star, text: "Compare smartphones" },
    { icon: Sparkles, text: "Smart home gadgets" },
    { icon: Heart, text: "Gift recommendations" }
  ];

  // Initialize chat session on mount
  useEffect(() => {
    if (!currentSessionId) {
      const sessionId = addSession([{
        id: crypto.randomUUID(),
        text: 'Hi! I\'m your shopping assistant. I can help you find products, add items to your cart or wishlist, and answer questions. What are you looking for today?',
        sender: 'assistant',
        timestamp: new Date()
      }]);
      setCurrentSession(sessionId);
      setCurrentMessages([{
        id: crypto.randomUUID(),
        type: 'assistant',
        content: 'Hi! I\'m your shopping assistant. I can help you find products, add items to your cart or wishlist, and answer questions. What are you looking for today?',
        timestamp: new Date()
      }]);
    } else {
      const sessionMessages = loadSession(currentSessionId);
      if (sessionMessages) {
        setCurrentMessages(sessionMessages.map(msg => ({
          id: crypto.randomUUID(),
          type: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
          timestamp: msg.timestamp
        })));
      }
    }
  }, [currentSessionId, addSession, loadSession, setCurrentSession]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // Handle authentication required actions
  const handleAuthRequiredAction = (action: () => void, actionType: 'cart' | 'wishlist') => {
    if (!session) {
      setAuthModalOpen(true);
      // Store the pending action in a simple way
      setTimeout(() => action(), 100);
      return;
    }
    action();
  };

  // Handle chat-based login
  const handleChatLogin = async (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('login') || lowerMessage.includes('log in')) {
      if (!loginStep) {
        setLoginStep('username');
        setAwaitingCredentials(true);
        addMessage(currentSessionId!, {
          type: 'system',
          content: 'I can help you log in! Please enter your username:',
          timestamp: new Date()
        });
        return true;
      }
    }

    if (awaitingCredentials) {
      if (loginStep === 'username') {
        setTempUsername(message);
        setLoginStep('password');
        addMessage(currentSessionId!, {
          type: 'system',
          content: 'Thanks! Now please enter your password:',
          timestamp: new Date()
        });
        return true;
      } else if (loginStep === 'password') {
        try {
          // Simulate login process
          setIsLoading(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Reset login state
          setAwaitingCredentials(false);
          setLoginStep(null);
          setTempUsername('');
          
          addMessage(currentSessionId!, {
            type: 'system',
            content: 'Login successful! You can now add items to your cart and wishlist. How can I help you shop today?',
            timestamp: new Date()
          });
          
          toast.success('Logged in successfully!');
          return true;
        } catch (error) {
          addMessage(currentSessionId!, {
            type: 'system',
            content: 'Login failed. Please try again or use the login modal above.',
            timestamp: new Date()
          });
          setAwaitingCredentials(false);
          setLoginStep(null);
          toast.error('Login failed');
          return true;
        }
      }
    }

    return false;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message
    addMessage(currentSessionId!, userMessage);
    const messageContent = inputMessage;
    setInputMessage("");
    
    // Check for chat-based login
    if (await handleChatLogin(messageContent)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const mcpClient = createMcpClient();
      const response = await mcpClient.sendMessage(
        messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        messageContent
      );

      const assistantMessage = {
        type: 'assistant' as const,
        content: response.message,
        timestamp: new Date(),
        products: response.products,
        searchQuery: response.searchQuery
      };

      addMessage(currentSessionId!, assistantMessage);

      if (response.products && response.products.length > 0) {
        toast.success(`Found ${response.products.length} products!`);
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      addMessage(currentSessionId!, {
        type: 'assistant',
        content: "Sorry, I'm having trouble connecting to my services right now. Please try again in a moment.",
        timestamp: new Date()
      });
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    handleAuthRequiredAction(() => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: 1
      });
      toast.success(`${product.title} added to cart!`);
    }, 'cart');
  };

  const handleAddToWishlist = (product: Product) => {
    handleAuthRequiredAction(() => {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description || '',
        image: product.image,
        category: product.category,
        rating: product.rating
      });
      toast.success(`${product.title} added to wishlist!`);
    }, 'wishlist');
  };

  const startNewSession = () => {
    const sessionId = createSession();
    addMessage(sessionId, {
      type: 'assistant',
      content: 'Hi! I\'m your shopping assistant. I can help you find products, add items to your cart or wishlist, and answer questions. What are you looking for today?',
      timestamp: new Date()
    });
    setShowChatHistory(false);
    toast.success('New chat started!');
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover rounded-md"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/64/64';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            {product.title}
          </h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-green-600">
              ${product.price}
            </span>
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">
                  {product.rating.rate} ({product.rating.count})
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleAddToCart(product)}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Add to Cart
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => handleAddToWishlist(product)}
            >
              <Heart className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => window.open(`/products/${product.id}`, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAIAssistantOpen) {
    return (
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-50"
        onClick={toggleAIAssistant}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
      </motion.button>
    );
  }

  return (
    <>
      <motion.div
        className="fixed inset-4 md:right-4 md:top-4 md:bottom-4 md:left-auto md:w-96 z-50 flex flex-col"
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
      >
        <Card className="h-full flex flex-col shadow-2xl">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">Shopping Assistant</h3>
                <p className="text-xs text-white/80">
                  {user ? `Welcome, ${user.name}!` : 'Your AI Shopping Guide'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setShowChatHistory(!showChatHistory)}
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={startNewSession}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              {!user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => {
                    setLoginMode(true);
                    openAuthModal();
                  }}
                >
                  <User className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleAIAssistant}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <div className="flex-1 flex relative">
            {/* Chat History Sidebar */}
            <AnimatePresence>
              {showChatHistory && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "50%" }}
                  exit={{ width: 0 }}
                  className="border-r overflow-hidden"
                >
                  <ChatHistorySidebar />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] ${
                            message.type === "user"
                              ? "bg-blue-500 text-white"
                              : message.type === "system"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                              : "bg-gray-100 text-gray-900"
                          } p-3 rounded-lg`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {/* Product Results */}
                    {messages[messages.length - 1]?.products && (
                      <div className="space-y-2">
                        {messages[messages.length - 1].products!.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    )}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Sparkles className="w-4 h-4 text-blue-500" />
                          </motion.div>
                          <span className="text-sm text-gray-600">
                            {awaitingCredentials ? 'Waiting for your input...' : 'Thinking...'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Suggestions */}
              {showSuggestions && messages.length <= 1 && (
                <div className="px-4 py-2 border-t bg-gray-50">
                  <p className="text-xs text-gray-600 mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((suggestion, index) => {
                      const IconComponent = suggestion.icon;
                      return (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 text-xs"
                          onClick={() => {
                            setInputMessage(suggestion.text);
                            setShowSuggestions(false);
                          }}
                        >
                          <IconComponent className="w-3 h-3 mr-1" />
                          {suggestion.text}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder={
                      awaitingCredentials 
                        ? loginStep === 'username' 
                          ? 'Enter your username...'
                          : 'Enter your password...'
                        : "Ask me anything about shopping..."
                    }
                    type={awaitingCredentials && loginStep === 'password' ? 'password' : 'text'}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Authentication Modal */}
      <AuthModal />
    </>
  );
};

export default AIAssistant;