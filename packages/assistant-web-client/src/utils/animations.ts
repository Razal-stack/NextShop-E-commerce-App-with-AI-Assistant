// Animation configurations for AssistantShell components

export const ANIMATION_CONFIG = {
  // Collapsed assistant animations
  collapsed: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    initial: { scale: 0, rotate: 180 },
    animate: { scale: 1, rotate: 0 },
    exit: { scale: 0, rotate: -180 },
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  },

  // Sparkles icon animation
  sparkles: {
    animate: {
      scale: [1, 1.2, 1] as number[],
      rotate: [0, 180, 360] as number[],
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    }
  },

  // Expanded shell animation
  expanded: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },

  // Button animations
  button: {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  },

  // Send button animation
  sendButton: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  },

  // Image preview animation
  imagePreview: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 }
  },

  // Typing indicator animation
  typingIndicator: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 }
  }
} as const;

// Utility function to get expanded animation with position
export const getExpandedAnimation = (isOnLeft: boolean) => ({
  ...ANIMATION_CONFIG.expanded,
  initial: { 
    ...ANIMATION_CONFIG.expanded.initial, 
    x: isOnLeft ? -400 : 400 
  },
  animate: { 
    ...ANIMATION_CONFIG.expanded.animate, 
    x: 0 
  },
  exit: { 
    ...ANIMATION_CONFIG.expanded.exit, 
    x: isOnLeft ? -400 : 400 
  }
});

// CSS styles for animations
export const ANIMATION_STYLES = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
