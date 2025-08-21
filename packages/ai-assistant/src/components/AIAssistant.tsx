// packages/ai-assistant/src/components/AIAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  History,
  Sparkles,
  ShoppingBag,
  Search,
} from 'lucide-react';
import { useAIAssistant } from '../context';
import { VoiceInput } from './VoiceInput';
import { ImageInput } from './ImageInput';
import { Message } from '../types';

export function AIAssistant() {
  const { client, config } = useAIAssistant();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hi! I'm ${config.assistantName}, ${config.assistantDescription}. How can I help you today? ✨`,
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

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await client.sendMessage(conversationHistory);
      
      const nexMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "nex",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, nexMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "nex",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInputText(transcript);
    setTimeout(() => handleSendMessage(transcript), 100);
  };

  const handleImageInput = async (base64: string) => {
    setIsTyping(true);
    try {
      const imageResult = await client.sendImage(base64);
      const searchQuery = `Find products like: ${imageResult.caption}`;
      
      const imageMessage: Message = {
        id: Date.now().toString(),
        text: `🖼️ I can see: ${imageResult.caption}`,
        sender: "nex",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, imageMessage]);
      
      // Automatically search for similar products
      setTimeout(() => handleSendMessage(searchQuery), 500);
    } catch (error) {
      console.error('Failed to process image:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't process that image. Please try again.",
        sender: "nex",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(question), 100);
  };

  const handleDrag = (event: any, info: any) => {
    if (!isExpanded) {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - 80, position.x + info.delta.x)
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - 80, position.y + info.delta.y)
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
          zIndex: 99999,
        }}
        className="cursor-move"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className={`w-16 h-16 bg-gradient-to-br from-${config.theme.gradientFrom} to-${config.theme.gradientTo} rounded-full shadow-lg flex items-center justify-center cursor-pointer`}
          onClick={() => setIsExpanded(true)}
          whileHover={{
            boxShadow: `0 0 20px ${config.theme.primaryColor}50`,
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
        className="fixed inset-4 md:inset-8 lg:left-auto lg:right-8 lg:top-20 lg:bottom-8 lg:w-96 z-[99999]"
      >
        <div className="h-full flex flex-col shadow-2xl bg-white/95 backdrop-blur-md border-0 rounded-lg">
          {/* Header */}
          <div className={`flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-${config.theme.gradientFrom} to-${config.theme.gradientTo} text-white rounded-t-lg p-4`}>
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
                <h3 className="font-semibold">{config.assistantName}</h3>
                <p className="text-xs text-white/80">{config.assistantDescription}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="h-8 w-8 text-white hover:bg-white/20 rounded p-1">
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 text-white hover:bg-white/20 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-0 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
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
                          ? `bg-${config.theme.primaryColor} text-white ml-auto`
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
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
                    <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        {[0, 0.2, 0.4].map((delay, index) => (
                          <motion.div
                            key={index}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Suggested Questions */}
            <div className="p-4 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {config.suggestedQuestions.slice(0, 3).map((question, index) => (
                  <span
                    key={index}
                    className="cursor-pointer hover:bg-blue-100 text-xs px-2 py-1 border border-gray-300 rounded-full"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </span>
                ))}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Input Area */}
            <div className="p-4 bg-white">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    placeholder={`Ask ${config.assistantName} anything...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-1">
                  <VoiceInput onVoiceInput={handleVoiceInput} disabled={isTyping} />
                  <ImageInput onImageInput={handleImageInput} disabled={isTyping} />
                  <button
                    onClick={() => handleSendMessage()}
                    className={`h-10 w-10 bg-gradient-to-r from-${config.theme.gradientFrom} to-${config.theme.gradientTo} hover:opacity-90 text-white rounded-lg flex items-center justify-center`}
                    disabled={!inputText.trim() || isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center space-x-4 mt-3">
                <button className="text-xs text-gray-600 hover:text-gray-800 flex items-center">
                  <Search className="w-3 h-3 mr-1" />
                  Search
                </button>
                <button className="text-xs text-gray-600 hover:text-gray-800 flex items-center">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  Products
                </button>
                <button className="text-xs text-gray-600 hover:text-gray-800 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Recommend
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
