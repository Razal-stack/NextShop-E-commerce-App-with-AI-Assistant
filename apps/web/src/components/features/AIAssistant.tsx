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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/lib/store";

interface Message {
  id: string;
  text: string;
  sender: "user" | "nex";
  timestamp: Date;
}

const suggestedQuestions = [
  "Show me trending products",
  "Find electronics under £100",
  "What's the best rated product?",
  "Help me find a gift for someone",
  "Show me today's deals",
  "Compare products for me",
];

export default function AIAssistant() {
  const { setCartOpen, setWishlistOpen, isCartOpen, isWishlistOpen } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm Nex, your AI shopping assistant. How can I help you find the perfect products today? ✨",
      sender: "nex",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I'd be happy to help you find that! Let me search our products for you. 🔍",
        "Great question! Based on your preferences, here are some recommendations I found. ⭐",
        "I found some amazing products that match what you're looking for! Would you like to see more details? 🛍️",
        "That's a popular choice! Here are the top-rated products in that category. 📈",
        "I can help you compare these options. Let me break down the key features for you. ⚖️",
      ];

      const nexMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[
          Math.floor(Math.random() * responses.length)
        ],
        sender: "nex",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, nexMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleDrag = (event: any, info: any) => {
    if (!isExpanded) {
      const newX = Math.max(
        0,
        Math.min(
          window.innerWidth - 80,
          position.x + info.delta.x,
        ),
      );
      const newY = Math.max(
        0,
        Math.min(
          window.innerHeight - 80,
          position.y + info.delta.y,
        ),
      );
      setPosition({ x: newX, y: newY });
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        drag
        dragConstraints={{
          left: 0,
          right: window.innerWidth - 80,
          top: 0,
          bottom: window.innerHeight - 80,
        }}
        onDrag={handleDrag}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: isCartOpen || isWishlistOpen ? 1 : 99999, // Very low z-index when cart/wishlist is open
          border: isCartOpen || isWishlistOpen ? '3px solid red' : '3px solid green', // Visual debug
        }}
        className="cursor-move"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className={`w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center cursor-pointer ${
            isCartOpen || isWishlistOpen ? 'opacity-50' : 'opacity-100'
          }`}
          onClick={() => {
            // If cart or wishlist is open, close them first, otherwise expand AI assistant
            if (isCartOpen || isWishlistOpen) {
              setCartOpen(false);
              setWishlistOpen(false);
            } else {
              setIsExpanded(true);
            }
          }}
          whileHover={{
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
          }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          {/* Notification dot */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.8,
          x: position.x,
          y: position.y,
        }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.8,
          x: position.x,
          y: position.y,
        }}
        className={`fixed inset-4 md:inset-8 lg:left-auto lg:right-8 lg:top-20 lg:bottom-8 lg:w-96 ${
          isCartOpen || isWishlistOpen ? 'z-10' : 'z-[99999]'
        }`}
      >
        <Card className="h-full flex flex-col shadow-2xl bg-white/95 backdrop-blur-md border-0">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              <div>
                <h3 className="font-semibold">
                  Nex AI Assistant
                </h3>
                <p className="text-xs text-white/80">
                  Your Shopping Copilot
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1 p-4">
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
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
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
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0,
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        ></motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        ></motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        ></motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator />

            {/* Suggested Questions */}
            <div className="p-4 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions
                  .slice(0, 3)
                  .map((question, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-100 text-xs px-2 py-1"
                      onClick={() =>
                        handleSuggestedQuestion(question)
                      }
                    >
                      {question}
                    </Badge>
                  ))}
              </div>
            </div>

            <Separator />

            {/* Input Area */}
            <div className="p-4 bg-white">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask Nex anything..."
                    value={inputText}
                    onChange={(e) =>
                      setInputText(e.target.value)
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    className="pr-12"
                  />
                </div>

                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    title="Voice search"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    title="Image search"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={!inputText.trim() || isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center space-x-4 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Search
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  Products
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Recommend
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}