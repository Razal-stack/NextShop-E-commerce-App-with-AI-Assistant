'use client';

/**
 * NexAssistantWrapper - Layout Integration Component
 * 
 * Wrapper component that manages state for NexAssistant
 * Used in layout.tsx to provide a simple, prop-less component
 */

import React, { useState, useCallback, useEffect } from 'react';
import { NexAssistant } from './NexAssistant';

/**
 * Simple wrapper that manages NexAssistant state internally
 * Perfect for layout integration
 */
export const NexAssistantWrapper: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Position the collapse icon at bottom-right of viewport
  // Account for icon size (56px) and margin (20px from edges)
  const getBottomRightPosition = () => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      return {
        x: window.innerWidth - 56 - 20,  // viewport width - icon width - margin
        y: window.innerHeight - 56 - 20  // viewport height - icon height - margin
      };
    }
    // Fallback for SSR - assume reasonable desktop viewport
    return { x: 1144, y: 644 }; // 1200 - 56 - 20 = 1124, 700 - 56 - 20 = 624
  };
  
  const [position, setPosition] = useState({ x: 20, y: 75 }); // Start with safe default

  // Update position after component mounts (client-side only)
  useEffect(() => {
    setPosition(getBottomRightPosition());
  }, []);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  }, []);

  // Update position on window resize to maintain bottom-right positioning
  useEffect(() => {
    const handleResize = () => {
      if (!isExpanded && typeof window !== 'undefined') {
        // Only update position when collapsed to maintain bottom-right positioning
        setPosition(getBottomRightPosition());
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isExpanded]);

  return (
    <NexAssistant
      isExpanded={isExpanded}
      onToggleExpanded={handleToggleExpanded}
      position={position}
      onPositionChange={handlePositionChange}
    />
  );
};

export default NexAssistantWrapper;
