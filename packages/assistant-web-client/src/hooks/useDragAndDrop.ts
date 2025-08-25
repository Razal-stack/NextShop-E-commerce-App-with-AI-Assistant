import { useState, useEffect, useCallback } from 'react';

export interface DragState {
  isDragging: boolean;
  hasDragged: boolean;
  currentPosition: { x: number; y: number };
}

export interface DragHandlers {
  handleMouseDown: (e: React.MouseEvent) => void;
  handleToggle: () => void;
}

export const useDragAndDrop = (
  initialPosition: { x: number; y: number },
  onDrag?: (position: { x: number; y: number }) => void,
  onToggleExpanded?: () => void
): DragState & DragHandlers => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(initialPosition);

  // Update position when prop changes
  useEffect(() => {
    setCurrentPosition(initialPosition);
  }, [initialPosition]);

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
      onToggleExpanded?.();
    }
  }, [hasDragged, onToggleExpanded]);

  return {
    // State
    isDragging,
    hasDragged,
    currentPosition,
    
    // Handlers
    handleMouseDown,
    handleToggle
  };
};
