'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, Square } from 'lucide-react';

// ==================== TYPES ====================

export interface InlineVoiceRecorderProps {
  isActive: boolean;
  voiceState: 'idle' | 'recording' | 'transcribed' | 'error';
  transcribedText: string;
  voiceError: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

// ==================== ENHANCED INLINE VOICE RECORDER COMPONENT ====================

export const InlineVoiceRecorder: React.FC<InlineVoiceRecorderProps> = ({
  isActive,
  voiceState,
  transcribedText,
  voiceError,
  onStartRecording,
  onStopRecording,
  onConfirm,
  onCancel,
  onRetry
}) => {
  if (!isActive) return null;

  return (
    <div 
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #e0e7ff 50%, #f8fafc 100%)',
        minHeight: '100%'
      }}
    >
      <AnimatePresence mode="wait">
        {/* ==================== RECORDING STATE ==================== */}
        {voiceState === 'recording' && (
          <motion.div
            key="recording"
            style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Main Recording Icon with Pulse Animation */}
            <motion.div
              style={{
                width: '88px',
                height: '88px',
                margin: '0 auto 24px auto',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0439d7',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(4, 57, 215, 0.25)'
              }}
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 8px 32px rgba(4, 57, 215, 0.25)',
                  '0 0 0 12px rgba(4, 57, 215, 0.15), 0 16px 40px rgba(4, 57, 215, 0.3)',
                  '0 0 0 24px rgba(4, 57, 215, 0), 0 20px 48px rgba(4, 57, 215, 0.2)'
                ]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Mic 
                style={{ 
                  width: '36px',
                  height: '36px',
                  color: '#ffffff',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
                  strokeWidth: '2.5'
                }} 
              />
              
              {/* Inner Glow Effect */}
              <div 
                style={{
                  position: 'absolute',
                  inset: '6px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}
              />
            </motion.div>

            {/* Title and Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '8px',
                letterSpacing: '-0.025em',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Listening...
              </h3>
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                marginBottom: '32px',
                fontWeight: '500',
                lineHeight: '1.5'
              }}>
                Speak clearly, I'm recording your voice
              </p>
            </motion.div>

            {/* Control Buttons */}
            <motion.div 
              style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              {/* Stop Recording Button */}
              <motion.button
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1d4ed8',
                  border: 'none',
                  boxShadow: '0 3px 12px rgba(29, 78, 216, 0.25), 0 1px 4px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: '0 4px 16px rgba(29, 78, 216, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12)'
                }}
                whileTap={{ scale: 0.96 }}
                onClick={onStopRecording}
              >
                <Square 
                  style={{ 
                    width: '16px',
                    height: '16px',
                    color: '#ffffff',
                    fill: '#ffffff',
                    strokeWidth: '0'
                  }} 
                />
                {/* Highlight Effect */}
                <div 
                  style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    pointerEvents: 'none'
                  }}
                />
              </motion.button>

              {/* Cancel Button */}
              <motion.button
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  border: '2px solid #0439d7',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(4, 57, 215, 0.12)',
                  cursor: 'pointer'
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: '0 4px 16px rgba(4, 57, 215, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08)',
                  borderColor: '#1d4ed8'
                }}
                whileTap={{ scale: 0.96 }}
                onClick={onCancel}
              >
                <X 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    color: '#0439d7',
                    strokeWidth: '2.5'
                  }} 
                />
              </motion.button>
            </motion.div>

            {/* Recording Indicator Dots */}
            <motion.div 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '6px', 
                marginTop: '24px' 
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#0439d7'
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ==================== TRANSCRIBED STATE ==================== */}
        {voiceState === 'transcribed' && (
          <motion.div
            key="transcribed"
            style={{ textAlign: 'center', width: '100%', maxWidth: '480px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Success Icon */}
            <motion.div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 20px auto',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0439d7',
                boxShadow: '0 0 0 6px rgba(4, 57, 215, 0.1), 0 8px 24px rgba(4, 57, 215, 0.25)'
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 200, 
                damping: 15,
                duration: 0.6
              }}
            >
              <Check 
                style={{ 
                  width: '32px',
                  height: '32px',
                  color: '#ffffff',
                  strokeWidth: '3'
                }} 
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Got it!
              </h3>
            </motion.div>

            {/* Transcribed Text Display */}
            <motion.div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(4, 57, 215, 0.1)',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <p style={{
                color: '#1e293b',
                fontSize: '16px',
                lineHeight: '1.6',
                textAlign: 'left',
                margin: '0',
                fontWeight: '500'
              }}>
                "{transcribedText}"
              </p>
            </motion.div>

            <motion.p 
              style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '32px',
                fontWeight: '500'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              Confirm to add to your message or try again
            </motion.p>

            {/* Confirmation Controls */}
            <motion.div 
              style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {/* Confirm Button */}
              <motion.button
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0439d7',
                  border: 'none',
                  boxShadow: '0 3px 12px rgba(4, 57, 215, 0.25), 0 1px 4px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: '0 4px 16px rgba(4, 57, 215, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12)'
                }}
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
              >
                <Check 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    color: '#ffffff',
                    strokeWidth: '3'
                  }} 
                />
                {/* Highlight */}
                <div 
                  style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    pointerEvents: 'none'
                  }}
                />
              </motion.button>

              {/* Cancel Button */}
              <motion.button
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  border: '2px solid #0439d7',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(4, 57, 215, 0.12)',
                  cursor: 'pointer'
                }}
                whileHover={{ 
                  scale: 1.08,
                  boxShadow: '0 4px 16px rgba(4, 57, 215, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08)',
                  borderColor: '#1d4ed8'
                }}
                whileTap={{ scale: 0.96 }}
                onClick={onCancel}
              >
                <X 
                  style={{ 
                    width: '20px',
                    height: '20px',
                    color: '#0439d7',
                    strokeWidth: '2.5'
                  }} 
                />
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* ==================== ERROR STATE ==================== */}
        {voiceState === 'error' && (
          <motion.div
            key="error"
            style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Error Icon */}
            <motion.div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 20px auto',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 0 6px rgba(239, 68, 68, 0.1), 0 8px 24px rgba(239, 68, 68, 0.25)'
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <X 
                style={{ 
                  width: '32px',
                  height: '32px',
                  color: '#ffffff',
                  strokeWidth: '3'
                }} 
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Recording Failed
              </h3>

              <p style={{
                fontSize: '15px',
                color: '#64748b',
                marginBottom: '28px',
                lineHeight: '1.5',
                padding: '0 12px'
              }}>
                {voiceError}
              </p>
            </motion.div>

            {/* Error Controls */}
            <motion.div 
              style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <motion.button
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#0439d7',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 8px 25px rgba(4, 57, 215, 0.3)',
                  cursor: 'pointer'
                }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 12px 35px rgba(4, 57, 215, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
              >
                Try Again
              </motion.button>

              <motion.button
                style={{
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#6b7280',
                  border: 'none',
                  color: '#ffffff',
                  boxShadow: '0 8px 25px rgba(107, 114, 128, 0.3)',
                  cursor: 'pointer'
                }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 12px 35px rgba(107, 114, 128, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InlineVoiceRecorder;
