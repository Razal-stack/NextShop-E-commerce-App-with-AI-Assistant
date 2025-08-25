'use client';

/**
 * NexAssistantWrapper - Layout Integration Component
 * 
 * Wrapper component that manages state for NexAssistant
 * Used in layout.tsx to provide a simple, prop-less component
 */

import React, { useState, useCallback } from 'react';
import { NexAssistant } from './NexAssistant';

/**
 * Simple wrapper that manages NexAssistant state internally
 * Perfect for layout integration
 */
export const NexAssistantWrapper: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 75 });

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handlePositionChange = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  }, []);

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
