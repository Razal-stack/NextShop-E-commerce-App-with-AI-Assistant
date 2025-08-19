'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calculator, SlidersHorizontal, BarChart3, ChevronRight, User, Mic, Image, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/lib/store';
import { toast } from 'sonner';

export default function DraggableNexAssistant() {
  const { isCartOpen, isWishlistOpen, setCartOpen, setWishlistOpen } = useUIStore();
  const [position, setPosition] = useState({ x: 20, y: 200 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isOnLeft, setIsOnLeft] = useState(false); // Default to right side
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  // Safe boundary constants
  const HEADER_HEIGHT = 80; // Approximate header height
  const EDGE_PADDING = 20; // Distance from screen edges
  const ICON_SIZE = 64;
  const DRAG_THRESHOLD = 3; // Minimum distance to consider as drag (reduced)

  // Initialize position properly at bottom-right
  useEffect(() => {
    const initPosition = () => {
      if (typeof window === 'undefined') return;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Start at bottom-right with safe boundaries
      const startX = windowWidth - ICON_SIZE - EDGE_PADDING;
      const startY = windowHeight - ICON_SIZE - EDGE_PADDING;
      
      setPosition({ x: startX, y: startY });
      setIsOnLeft(false); // Starting on right side
    };

    const timer = setTimeout(initPosition, 100);
    window.addEventListener('resize', initPosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initPosition);
    };
  }, []);

  const handleDragStart = () => {
    setIsDragging(true);
    setHasDragged(false);
  };

  const handleDrag = (event: any, info: any) => {
    // Detect if user has actually dragged beyond threshold
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    if (dragDistance > DRAG_THRESHOLD) {
      setHasDragged(true);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    
    // If dragged, update position to where it was dropped BUT enforce strict boundaries
    if (hasDragged && !isExpanded) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate the desired final position
      const desiredX = position.x + info.offset.x;
      const desiredY = position.y + info.offset.y;
      
      // Apply STRICT boundary constraints
      const minY = HEADER_HEIGHT + EDGE_PADDING; // Below header with padding
      const maxY = windowHeight - ICON_SIZE - EDGE_PADDING; // Above bottom edge
      const minX = EDGE_PADDING; // Away from left edge
      const maxX = windowWidth - ICON_SIZE - EDGE_PADDING; // Away from right edge
      
      // Constrain the position within strict boundaries
      const finalX = Math.max(minX, Math.min(maxX, desiredX));
      const finalY = Math.max(minY, Math.min(maxY, desiredY));
      
      // Update to the constrained position
      setPosition({ x: finalX, y: finalY });
      
      // Determine which side for expanded chat positioning
      const centerX = windowWidth / 2;
      const iconCenterX = finalX + (ICON_SIZE / 2);
      setIsOnLeft(iconCenterX < centerX);
    }
    
    // Reset drag state after a brief delay to prevent click interference
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    toast.success("Nex is analyzing your request...");
    setInputText('');
  };

  const handleToggleExpanded = () => {
    // Only toggle if we haven't just finished dragging
    if (!hasDragged && !isDragging) {
      // If cart or wishlist is open, close them first
      if (isCartOpen || isWishlistOpen) {
        setCartOpen(false);
        setWishlistOpen(false);
      } else {
        setIsExpanded(!isExpanded);
      }
    }
  };

  // Fixed positions for expanded chat interface - always consistent positioning
  const getExpandedPosition = () => {
    const zIndex = isCartOpen || isWishlistOpen ? 'z-10' : 'z-50'; // Lower z-index when cart/wishlist is open
    if (isOnLeft) {
      return `fixed left-6 top-24 bottom-6 w-[28rem] ${zIndex}`; // Left side - increased width
    } else {
      return `fixed right-6 top-24 bottom-6 w-[28rem] ${zIndex}`; // Right side - increased width
    }
  };

  // Don't render the draggable icon when expanded
  if (!isExpanded) {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    return (
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        // Allow free dragging within screen bounds
        dragConstraints={{
          left: EDGE_PADDING,
          right: windowWidth - ICON_SIZE - EDGE_PADDING,
          top: HEADER_HEIGHT + EDGE_PADDING,
          bottom: windowHeight - ICON_SIZE - EDGE_PADDING
        }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ 
          x: position.x, 
          y: position.y
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          mass: 0.8
        }}
        style={{ 
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: isCartOpen || isWishlistOpen ? 10 : 9999 // Lower z-index when cart/wishlist is open
        }}
        className="cursor-move"
        whileHover={{ scale: isDragging ? 1 : 1.05 }}
        whileTap={{ scale: isDragging ? 1 : 0.95 }}
        whileDrag={{ 
          scale: 1.1,
          rotate: [0, -2, 2, 0],
          transition: { rotate: { duration: 0.2 } }
        }}
      >
        <motion.div
          className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center cursor-pointer relative overflow-hidden brand-glow ${
            isDragging ? 'shadow-2xl' : ''
          }`}
          style={{ 
            background: isDragging 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'var(--brand-gradient)',
            opacity: isCartOpen || isWishlistOpen ? 0.7 : 1 // Dimmed when cart/wishlist is open
          }}
          onClick={handleToggleExpanded}
          whileHover={{ 
            boxShadow: isDragging 
              ? "0 0 40px rgba(102, 126, 234, 0.8)" 
              : "0 0 30px rgba(4, 57, 215, 0.5)",
          }}
        >
          <motion.div
            animate={isDragging ? {
              rotate: [0, 180, 360],
              scale: [1, 1.3, 1]
            } : { 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={isDragging ? {
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
            } : { 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className={`${isDragging ? 'w-10 h-10' : 'w-8 h-8'} text-white transition-all duration-200`} />
          </motion.div>
          <div className="absolute inset-0 ai-shimmer"></div>
          
          {/* Pulsing notification */}
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center pulse-brand"
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </motion.div>
          
          {/* Drag hint when hovering and not dragging */}
          {!isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-600 whitespace-nowrap pointer-events-none"
            >
              Drag to move • Click to chat
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Expanded chat interface with fixed positioning and smooth animations
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.8,
        x: isOnLeft ? -50 : 50,
        y: -20
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: 0,
        y: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        x: isOnLeft ? -50 : 50,
        y: -20
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
      className={getExpandedPosition()}
    >
      <Card className="h-full flex flex-col shadow-2xl border-0 overflow-hidden bg-white backdrop-blur-sm">
        {/* Modern Header with improved visual hierarchy */}
        <div className="relative flex items-center justify-between p-4 text-white" style={{ background: 'var(--brand-gradient)' }}>
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)'
          }}></div>
          
          <div className="relative flex items-center space-x-3">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">Nex Assistant</h3>
              <p className="text-xs text-white/90 font-medium">AI Shopping Expert</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            className="relative h-10 w-10 text-white hover:bg-white/15 rounded-xl transition-all duration-200"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              ×
            </motion.div>
          </Button>
        </div>

        {/* Chat Content Area with cleaner, more spacious design */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            {/* Clean Welcome Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Welcome to Nex Assistant</h4>
              <p className="text-slate-600 leading-relaxed">
                I'll help you build the perfect cart within your budget and specifications.
              </p>
            </div>

            {/* Key Features with clean spacing - reduced to 3 items */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-3"></span>
                What I can help you with
              </h5>
              <div className="space-y-3">
                {[
                  { 
                    text: "Build cart within your budget", 
                    icon: Calculator, 
                    desc: "Set your budget and I'll find the best products" 
                  },
                  { 
                    text: "Find products by specifications", 
                    icon: SlidersHorizontal, 
                    desc: "Tell me your requirements and I'll match them" 
                  },
                  { 
                    text: "Compare similar products", 
                    icon: BarChart3, 
                    desc: "Side-by-side comparison of features and prices" 
                  }
                ].map((feature, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputText(feature.text)}
                    className="flex items-start p-3 text-left bg-white hover:bg-slate-50 rounded-lg border border-slate-200 hover:border-brand-200 transition-all duration-200 w-full group"
                  >
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-brand-100 transition-colors duration-200">
                      <feature.icon className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 mb-1">
                        {feature.text}
                      </div>
                      <div className="text-xs text-slate-500">
                        {feature.desc}
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-brand-500 transition-colors duration-200 mt-1" />
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Sample conversation - simplified and smaller */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-slate-700 flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Recent Help
              </h5>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-slate-600" />
                  </div>
                  <span className="text-xs text-slate-700">"Gaming setup under £500"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs text-slate-600">Found 3 complete setups within budget</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Enhanced Input Area - Fixed at bottom with guaranteed visibility */}
          <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200">
            <div className="space-y-3">
              {/* Large textarea for better typing experience */}
              <div className="relative">
                <textarea
                  placeholder="Say: &quot;Laptop under £800 for design&quot; or &quot;Build office setup for £1200&quot;"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="w-full h-16 p-3 bg-slate-50 border border-slate-200 hover:border-brand-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-200/50 rounded-lg resize-none text-sm leading-relaxed transition-all duration-200 placeholder:text-slate-400 scrollbar-none overflow-hidden"
                  rows={2}
                />
                {inputText && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                  </motion.div>
                )}
              </div>
              
              {/* Action row with clean spacing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all duration-200"
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Record
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all duration-200"
                  >
                    <Image className="w-3 h-3 mr-1" />
                    Image Search
                  </Button>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="h-8 px-4 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: inputText.trim() ? 'var(--brand-gradient)' : '#e2e8f0' }}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
