'use client';

/**
 * @nextshop/assistant-web-client - Generic UI Shell
 * ONLY UI/UX - no business logic
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  X, 
  Mic, 
  Image as ImageIcon, 
  RotateCcw,
  ArrowUp
} from 'lucide-react';

// ==================== TYPES ====================

export interface AssistantShellConfig {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  animatedPlaceholder?: string;
  enableVoice?: boolean;
  enableImage?: boolean;
  enableReset?: boolean;
}

export interface AssistantShellProps {
  // Core state
  isExpanded: boolean;
  isProcessing?: boolean;
  position?: { x: number; y: number };
  
  // Configuration
  config: AssistantShellConfig;
  
  // Content - rendered by web app
  children?: React.ReactNode;
  
  // Input control - controlled by web app
  inputValue: string;
  onInputChange: (value: string) => void;
  
  // Event handlers - ONLY UI events
  onToggleExpanded: () => void;
  onReset?: () => void;
  onVoiceClick?: () => void;
  onImageClick?: () => void;
  onSendMessage: (message: string) => void;
  onDrag?: (position: { x: number; y: number }) => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

// ==================== MAIN COMPONENT ====================

export const AssistantShell: React.FC<AssistantShellProps> = ({
  isExpanded,
  isProcessing = false,
  position = { x: 0, y: 0 },
  config,
  children,
  inputValue,
  onInputChange,
  onToggleExpanded,
  onReset,
  onVoiceClick,
  onImageClick,
  onSendMessage,
  onDrag,
  className,
  style
}) => {
  // ==================== DRAGGING STATE ====================
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);

  // Update position when prop changes
  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  // ==================== DRAG HANDLERS ====================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.dragHandle')) {
      setIsDragging(true);
      setHasDragged(false);
      
      const startX = e.clientX - currentPosition.x;
      const startY = e.clientY - currentPosition.y;
      
      const handleMouseMove = (e: MouseEvent) => {
        setHasDragged(true);
        // Viewport boundaries like original
        const newX = Math.max(0, Math.min((typeof window !== 'undefined' ? window.innerWidth : 1200) - 56, e.clientX - startX));
        const newY = Math.max(0, Math.min((typeof window !== 'undefined' ? window.innerHeight : 800) - 56, e.clientY - startY));
        
        const newPosition = { x: newX, y: newY };
        setCurrentPosition(newPosition);
        onDrag?.(newPosition);
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [currentPosition, onDrag]);

  const handleToggle = useCallback(() => {
    if (!hasDragged) {
      onToggleExpanded();
    }
  }, [hasDragged, onToggleExpanded]);

  // ==================== INPUT HANDLERS ====================
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
    }
  }, [inputValue, isProcessing, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isProcessing) {
        onSendMessage(inputValue.trim());
      }
    }
  }, [inputValue, isProcessing, onSendMessage]);

  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${Math.max(56, Math.min(target.scrollHeight, 120))}px`;
  }, []);

  // ==================== POSITION CALCULATION ====================
  const isOnLeft = currentPosition.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
  const expandedLeft = isOnLeft ? 20 : undefined;
  const expandedRight = isOnLeft ? undefined : 20;

  // ==================== COLLAPSED STATE ====================
  if (!isExpanded) {
    return (
      <motion.div
        key="collapsed-assistant"
        className={`fixed z-40 cursor-pointer dragHandle ${className || ''}`}
        style={{ 
          left: currentPosition.x, 
          top: currentPosition.y,
          ...style 
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: -180 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        onMouseDown={handleMouseDown}
        onClick={handleToggle}
      >
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            background: 'var(--brand-gradient, linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%))'
          }}
        >
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

  // ==================== EXPANDED STATE ====================
  return (
    <AnimatePresence>
      <motion.div
        key="expanded-assistant"
        className={`fixed z-40 bg-white rounded-lg shadow-2xl border-0 flex flex-col overflow-hidden ${className || ''}`}
        style={{
          left: expandedLeft,
          right: expandedRight,
          top: 75,
          bottom: 20,
          width: '22vw',
          minWidth: '340px',
          maxWidth: '400px',
          ...style,
        }}
        initial={{ opacity: 0, scale: 0.8, x: isOnLeft ? -400 : 400 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: isOnLeft ? -400 : 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* ==================== HEADER ==================== */}
        <motion.div
          className="flex items-center justify-between px-6 py-4 cursor-grab dragHandle"
          style={{
            background: 'var(--brand-gradient, linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%))'
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-3">
            {/* Animated avatar */}
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
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
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>

            {/* Title and subtitle */}
            <div>
              <h3 className="font-bold text-lg text-white m-0">
                {config.title || 'Assistant'}
              </h3>
              {config.subtitle && (
                <p className="text-xs text-white/80 m-0">
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Header controls */}
          <div className="flex items-center space-x-2">
            {config.enableReset && onReset && (
              <motion.button
                onClick={onReset}
                className="p-1 text-white hover:text-white hover:bg-white/10 rounded transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
            
            <motion.button
              onClick={onToggleExpanded}
              className="p-1 text-white hover:text-white hover:bg-white/10 rounded transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* ==================== MESSAGES AREA ==================== */}
        <div 
          className="flex-1 overflow-y-auto bg-white"
        >
          {children}
        </div>

        {/* ==================== INPUT AREA ==================== */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="relative flex items-stretch bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 min-h-[3.5rem]">
                
                {/* Left side icons */}
                <div className="flex items-center pl-4 space-x-2">
                  {config.enableVoice && onVoiceClick && (
                    <button
                      type="button"
                      onClick={onVoiceClick}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200 flex items-center justify-center border-0 bg-transparent"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                  
                  {config.enableImage && onImageClick && (
                    <button
                      type="button"
                      onClick={onImageClick}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200 flex items-center justify-center border-0 bg-transparent"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onInput={handleTextareaInput}
                    className="w-full max-h-32 min-h-[3.5rem] py-4 px-3 bg-transparent border-none resize-none text-sm leading-relaxed focus:outline-none scrollbar-thin"
                    rows={1}
                    style={{ 
                      height: 'auto',
                      overflowY: inputValue.split('\n').length > 2 ? 'auto' : 'hidden'
                    }}
                    placeholder=""
                    disabled={isProcessing}
                  />
                  
                  {/* Animated placeholder */}
                  {!inputValue && (
                    <div className="absolute inset-0 py-4 px-3 pointer-events-none flex items-center">
                      <div className="text-slate-400 text-sm">
                        <span>{config.animatedPlaceholder || config.placeholder || 'Type your message...'}</span>
                        {config.animatedPlaceholder && (
                          <span 
                            className="ml-1 animate-pulse"
                            style={{ color: 'var(--brand-500, #0439d7)' }}
                          >
                            |
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Send button */}
                <div className="flex items-center pr-4">
                  <motion.button
                    type="submit"
                    disabled={!inputValue.trim() || isProcessing}
                    className="h-9 w-9 p-0 rounded-full transition-all duration-200 shadow-sm border-0 flex items-center justify-center"
                    style={
                      inputValue.trim() && !isProcessing
                        ? { 
                            background: 'var(--brand-gradient, linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%))',
                            color: 'white'
                          }
                        : {
                            backgroundColor: '#cbd5e1',
                            color: '#64748b',
                            cursor: 'not-allowed'
                          }
                    }
                    whileHover={inputValue.trim() && !isProcessing ? { scale: 1.05 } : {}}
                    whileTap={inputValue.trim() && !isProcessing ? { scale: 0.95 } : {}}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Typing indicator */}
              {inputValue && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-16"
                >
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: 'var(--brand-500, #0439d7)' }}
                  />
                </motion.div>
              )}
            </div>

            {/* Helper text */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4 text-slate-500">
                <span className="flex items-center">
                  <span 
                    className="w-1.5 h-1.5 rounded-full mr-2" 
                    style={{ backgroundColor: 'var(--brand-400, #60a5fa)' }}
                  />
                  Press Enter to send
                </span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full mr-2 bg-slate-300" />
                  Shift + Enter for new line
                </span>
              </div>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Add shimmer animation styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </AnimatePresence>
  );
};
