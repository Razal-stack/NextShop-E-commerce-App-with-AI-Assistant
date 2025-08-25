'use client';

/**
 * @nextshop/assistant-web-client - Generic UI Shell (Refactored)
 * ONLY UI/UX - no business logic
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  X, 
  Mic, 
  RotateCcw,
  ArrowUp
} from 'lucide-react';
import { ImageUploader, type ImageData } from './ImageUploader';
import { InlineVoiceRecorder } from './InlineVoiceRecorder';

// Import custom hooks directly (will fix barrel export later)
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useInputHandlers } from '../hooks/useInputHandlers';
import { useImageManagement } from '../hooks/useImageManagement';

// Import animation configs
import { ANIMATION_CONFIG, getExpandedAnimation, ANIMATION_STYLES } from '../utils/animations';

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
  onSendMessage: (message: string, imageData?: ImageData) => void;
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
  // ==================== CUSTOM HOOKS ====================
  
  // Voice recording functionality
  const voiceRecording = useVoiceRecording();
  
  // Image management functionality
  const imageManagement = useImageManagement(onImageClick);
  
  // Drag and drop functionality
  const dragAndDrop = useDragAndDrop(position, onDrag, onToggleExpanded);
  
  // Input handling functionality
  const inputHandlers = useInputHandlers(
    inputValue,
    isProcessing,
    imageManagement.selectedImage,
    onSendMessage,
    imageManagement.handleImageRemove
  );

  // ==================== ENHANCED HANDLERS ====================
  
  const handleVoiceClick = useCallback(() => {
    // Call optional external handler first
    onVoiceClick?.();
    
    // Then handle internal voice logic
    voiceRecording.handleVoiceClick(
      inputValue, 
      onInputChange, 
      imageManagement.handleImageRemove
    );
  }, [onVoiceClick, voiceRecording.handleVoiceClick, inputValue, onInputChange, imageManagement.handleImageRemove]);

  const handleInternalReset = useCallback(() => {
    // Clean up all internal state
    imageManagement.cleanup();
    voiceRecording.cleanup();
    
    // Then call external reset handler
    onReset?.();
  }, [imageManagement.cleanup, voiceRecording.cleanup, onReset]);

  // ==================== POSITION CALCULATION ====================
  const isOnLeft = dragAndDrop.currentPosition.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
  const expandedLeft = isOnLeft ? 20 : undefined;
  const expandedRight = isOnLeft ? undefined : 20;

  // ==================== COLLAPSED STATE ====================
  if (!isExpanded) {
    return (
      <motion.div
        key="collapsed-assistant"
        className={`fixed z-40 cursor-pointer dragHandle ${className || ''}`}
        style={{ 
          left: dragAndDrop.currentPosition.x, 
          top: dragAndDrop.currentPosition.y,
          ...style 
        }}
        {...ANIMATION_CONFIG.collapsed}
        initial={{ scale: 1, rotate: 0 }} // Override to ensure visibility on mount
        onMouseDown={dragAndDrop.handleMouseDown}
        onClick={dragAndDrop.handleToggle}
      >
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            background: 'var(--brand-gradient, linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%))'
          }}
        >
          <motion.div 
            animate={ANIMATION_CONFIG.sparkles.animate}
            transition={ANIMATION_CONFIG.sparkles.transition}
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
        {...getExpandedAnimation(isOnLeft)}
      >
        {/* ==================== HEADER ==================== */}
        <motion.div
          className="flex items-center justify-between px-6 py-4 cursor-grab dragHandle"
          style={{
            background: 'var(--brand-gradient, linear-gradient(135deg, #0439d7 0%, #1d4ed8 50%, #1e40af 100%))'
          }}
          onMouseDown={dragAndDrop.handleMouseDown}
        >
          <div className="flex items-center space-x-3">
            {/* Animated avatar */}
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              <motion.div 
                animate={ANIMATION_CONFIG.sparkles.animate}
                transition={ANIMATION_CONFIG.sparkles.transition}
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
                onClick={handleInternalReset}
                className="p-1 text-white hover:text-white hover:bg-white/10 rounded transition-colors"
                {...ANIMATION_CONFIG.button}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            )}
            
            <motion.button
              onClick={onToggleExpanded}
              className="p-1 text-white hover:text-white hover:bg-white/10 rounded transition-colors"
              {...ANIMATION_CONFIG.button}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* ==================== MESSAGES AREA ==================== */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Voice Recording Interface - Replaces messages when active */}
          {voiceRecording.isVoiceMode ? (
            <InlineVoiceRecorder
              isActive={voiceRecording.isVoiceMode}
              voiceState={voiceRecording.voiceState}
              transcribedText={voiceRecording.transcribedText}
              voiceError={voiceRecording.voiceError}
              onStartRecording={voiceRecording.startVoiceRecording}
              onStopRecording={voiceRecording.stopVoiceRecording}
              onConfirm={() => voiceRecording.confirmVoiceTranscription(onInputChange)}
              onCancel={voiceRecording.cancelVoiceRecording}
              onRetry={() => {
                voiceRecording.startVoiceRecording();
              }}
            />
          ) : (
            children
          )}
        </div>

        {/* ==================== INPUT AREA ==================== */}
        {/* Hide input area when in voice mode */}
        {!voiceRecording.isVoiceMode && (
          <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200">
            {/* Image Preview Area */}
            {imageManagement.selectedImage && (
              <motion.div
                className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                {...ANIMATION_CONFIG.imagePreview}
              >
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={imageManagement.selectedImage.preview}
                      alt={imageManagement.selectedImage.file.name}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-700 truncate mb-1">
                      {imageManagement.selectedImage.file.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {(imageManagement.selectedImage.file.size / 1024).toFixed(1)} KB • {imageManagement.selectedImage.file.type.split('/')[1].toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ready to send with your message
                    </p>
                  </div>
                  <motion.button
                    onClick={imageManagement.handleImageRemove}
                    className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                    {...ANIMATION_CONFIG.button}
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            <form onSubmit={inputHandlers.handleSubmit} className="space-y-3">
              <div className="relative">
                <div className="relative flex items-stretch bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 min-h-[3.5rem]">
                  
                  {/* Left side icons */}
                  <div className="flex items-center pl-4 space-x-2">
                    {config.enableVoice && (
                      <motion.button
                        type="button"
                        onClick={handleVoiceClick}
                        disabled={isProcessing}
                        className={`
                          h-8 w-8 p-0 rounded-full transition-colors duration-200 
                          flex items-center justify-center border-0 bg-transparent
                          ${isProcessing 
                            ? 'text-slate-400 cursor-not-allowed' 
                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                          }
                        `}
                        whileHover={!isProcessing ? { scale: 1.1 } : {}}
                        whileTap={!isProcessing ? { scale: 0.9 } : {}}
                        title="Voice input"
                      >
                        <Mic className="w-4 h-4" />
                      </motion.button>
                    )}
                    
                    {config.enableImage && (
                      <ImageUploader
                        onImageSelect={imageManagement.handleImageSelect}
                        onImageRemove={imageManagement.handleImageRemove}
                        selectedImage={imageManagement.selectedImage}
                        disabled={isProcessing}
                      />
                    )}
                  </div>

                  {/* Textarea */}
                  <div className="flex-1 relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => onInputChange(e.target.value)}
                      onKeyPress={inputHandlers.handleKeyPress}
                      onInput={inputHandlers.handleTextareaInput}
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
                      {...(inputValue.trim() && !isProcessing ? ANIMATION_CONFIG.sendButton : {})}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Typing indicator */}
                {inputValue && (
                  <motion.div
                    {...ANIMATION_CONFIG.typingIndicator}
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
        )}
      </motion.div>

      {/* Add shimmer animation styles */}
      <style>{ANIMATION_STYLES}</style>
    </AnimatePresence>
  );
};
