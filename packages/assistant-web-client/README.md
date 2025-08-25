# @nextshop/assistant-web-client

A clean, reusable React component library providing a generic UI shell for AI shopping assistants.

[![npm version](https://badge.fury.io/js/@nextshop/assistant-web-client.svg)](https://badge.fury.io/js/@nextshop/assistant-web-client)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎨 **Sophisticated UI**
- **Exact replica** of advanced chat interfaces with pixel-perfect animations
- Framer Motion powered smooth transitions and micro-interactions
- Draggable interface with intelligent positioning
- Responsive design with mobile support
- Rich theming system with CSS-in-JS styling

### 🗣️ **Conversation Modes**
- **Text mode**: Traditional chat interface
- **Voice mode**: Speech-to-text and text-to-speech capabilities
- **Image mode**: Image sharing and visual input
- **Media mode**: File uploads and multimedia support
- **Multi-modal**: Seamless switching between all modes

### 🎯 **Generic & Pluggable**
- **Zero domain knowledge** - works with any application
- **Pluggable architecture** - bring your own message handlers
- **Framework agnostic core** with React wrapper
- **Complete customization** of UI, behavior, and styling
- **TypeScript first** with comprehensive type definitions

### 🚀 **Advanced Features**
- Real-time message streaming
- Typing indicators and status messages
- Message pagination and infinite scroll
- Voice recording with waveform visualization
- Image capture and file drag-and-drop
- Persistent conversation history
- Plugin system for extensions
- Event-driven architecture

## 📦 Installation

```bash
# Using npm
npm install @nextshop/assistant-web-client framer-motion lucide-react

# Using yarn  
yarn add @nextshop/assistant-web-client framer-motion lucide-react

# Using pnpm
pnpm add @nextshop/assistant-web-client framer-motion lucide-react
```

## 🚀 Quick Start

### Basic Usage

```tsx
import React from 'react';
import { AssistantWebClient, createMessageHandler } from '@nextshop/assistant-web-client';

// Create your message handler (connects to your API)
const messageHandler = createMessageHandler(async (content: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: content }),
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await response.json();
  return data.reply; // Your API response
});

function App() {
  return (
    <AssistantWebClient
      messageHandler={messageHandler}
      config={{
        title: "My Assistant",
        welcomeTitle: "Hello! 👋",
        welcomeDescription: "How can I help you today?",
        conversationModes: ['text', 'voice', 'image']
      }}
      theme={{
        primary: '#0066cc',
        surface: '#ffffff',
        text: '#333333'
      }}
      onMessage={(content) => console.log('User message:', content)}
      onExpandChange={(expanded) => console.log('Assistant expanded:', expanded)}
    />
  );
}
```

### With Conversation Modes

```tsx
import { VoiceAssistant, MultiModalAssistant } from '@nextshop/assistant-web-client';

// Voice-enabled assistant
function VoiceApp() {
  const handleVoiceMessage = async (audioBlob: Blob) => {
    // Process voice input
    const text = await convertSpeechToText(audioBlob);
    return `I heard: "${text}"`;
  };

  return (
    <VoiceAssistant
      messageHandler={{
        sendMessage: async (content) => ({ /* text response */ }),
        sendVoiceMessage: handleVoiceMessage
      }}
    />
  );
}

// Multi-modal assistant with all features
function FullFeaturedApp() {
  return (
    <MultiModalAssistant
      messageHandler={{
        sendMessage: async (content) => ({ /* text response */ }),
        sendVoiceMessage: async (audio) => ({ /* voice response */ }),
        sendImageMessage: async (image) => ({ /* image analysis */ }),
        sendMediaMessage: async (media) => ({ /* media processing */ })
      }}
      config={{
        title: "Advanced Assistant",
        conversationModes: ['text', 'voice', 'image', 'media'],
        enableDragging: true,
        maxMessages: 50
      }}
    />
  );
}
```

### Using Hooks

```tsx
import { useAssistant, useConversationModes } from '@nextshop/assistant-web-client';

function CustomAssistant() {
  const {
    core,
    state,
    sendMessage,
    toggleExpanded,
    setMode,
    clearMessages
  } = useAssistant({
    config: { conversationModes: ['text', 'voice'] },
    messageHandler: myMessageHandler
  });

  const {
    currentMode,
    supportedModes,
    switchMode,
    isVoiceRecording,
    startVoiceRecording,
    stopVoiceRecording
  } = useConversationModes(core);

  return (
    <div>
      {/* Mode switching */}
      {supportedModes.map(mode => (
        <button key={mode} onClick={() => switchMode(mode)}>
          {mode} {currentMode === mode ? '✓' : ''}
        </button>
      ))}
      
      {/* Voice controls */}
      {currentMode === 'voice' && (
        <button 
          onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
        >
          {isVoiceRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      )}
      
      {/* Your custom UI */}
      <MyCustomUI state={state} onSend={sendMessage} />
    </div>
  );
}
```

## 🎛️ Configuration

### Assistant Config

```tsx
interface AssistantConfig {
  // Basic settings
  title?: string;                    // "Assistant" 
  subtitle?: string;                 // "Online"
  avatar?: string;                   // "🤖"
  placeholder?: string;              // "Type your message..."
  
  // UI settings
  width?: number;                    // 400
  height?: number;                   // 520
  collapsedSize?: number;           // 48
  enableDragging?: boolean;         // true
  
  // Conversation modes
  conversationModes?: ConversationMode[]; // ['text']
  enableVoice?: boolean;            // false
  enableImage?: boolean;            // false  
  enableMedia?: boolean;            // false
  
  // Advanced settings
  maxMessages?: number;             // 100
  persistMessages?: boolean;        // false
  showTimestamps?: boolean;         // false
  allowMarkdown?: boolean;          // false
}
```

### Theme Configuration

```tsx
interface AssistantTheme {
  // Colors
  primary?: string;                 // '#3b82f6'
  primaryHover?: string;            // '#2563eb'
  surface?: string;                 // '#ffffff'
  background?: string;              // '#ffffff'
  text?: string;                    // '#1e293b'
  textSecondary?: string;           // '#64748b'
  border?: string;                  // '#e2e8f0'
  success?: string;                 // '#10b981'
  warning?: string;                 // '#f59e0b'
  error?: string;                   // '#ef4444'
  
  // Layout
  borderRadius?: string;            // '16px'
  shadow?: string;                  // '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  zIndexModal?: number;             // 1000
  
  // Typography
  fontSize?: {
    xs?: string;                    // '12px'
    sm?: string;                    // '14px'
    md?: string;                    // '16px'
    lg?: string;                    // '18px'
    xl?: string;                    // '24px'
  };
  
  // Spacing
  spacing?: {
    xs?: string;                    // '4px'
    sm?: string;                    // '8px'
    md?: string;                    // '16px'
    lg?: string;                    // '24px'
    xl?: string;                    // '32px'
  };
  
  // Animations
  animation?: {
    fast?: string;                  // '0.2s ease'
    normal?: string;                // '0.3s ease'
    slow?: string;                  // '0.5s ease'
  };
}
```

## 🔧 Advanced Usage

### Custom Message Handlers

```tsx
import { MessageHandler } from '@nextshop/assistant-web-client';

const advancedHandler: MessageHandler = {
  // Text messages
  sendMessage: async (content: string, context?: any) => {
    const response = await myAPI.sendMessage(content, context);
    return {
      id: generateId(),
      content: response.text,
      sender: 'assistant',
      timestamp: new Date(),
      customData: response.metadata
    };
  },
  
  // Voice messages  
  sendVoiceMessage: async (audioBlob: Blob, context?: any) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await myAPI.processVoice(formData);
    return {
      id: generateId(),
      content: response.transcription,
      sender: 'assistant', 
      timestamp: new Date(),
      messageType: 'voice',
      metadata: { 
        voiceDuration: response.duration,
        confidence: response.confidence 
      }
    };
  },
  
  // Image messages
  sendImageMessage: async (imageFile: File, context?: any) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await myAPI.analyzeImage(formData);
    return {
      id: generateId(),
      content: response.description,
      sender: 'assistant',
      timestamp: new Date(),
      messageType: 'image',
      metadata: { 
        imageUrl: response.processedImageUrl,
        analysis: response.analysis 
      }
    };
  }
};
```

### Custom UI Handlers

```tsx
import { UIHandler } from '@nextshop/assistant-web-client';

const uiHandler: UIHandler = {
  onMessage: (message) => {
    console.log('New message:', message);
    // Analytics, logging, etc.
  },
  
  onPositionChange: (position) => {
    localStorage.setItem('assistant-position', JSON.stringify(position));
  },
  
  onModeChange: (mode) => {
    console.log('Mode changed to:', mode);
    // Update UI, enable/disable features
  },
  
  onVoiceStart: () => {
    document.body.classList.add('voice-recording');
  },
  
  onVoiceEnd: (audioBlob) => {
    document.body.classList.remove('voice-recording');
    // Process audio
  },
  
  onImageCapture: (imageFile) => {
    console.log('Image captured:', imageFile.name);
    // Preview, validation, etc.
  }
};
```

### Plugin System

```tsx
import { Plugin, AssistantCore } from '@nextshop/assistant-web-client';

// Create a plugin
const analyticsPlugin: Plugin = {
  name: 'analytics',
  version: '1.0.0',
  supportedModes: ['text', 'voice'],
  
  init(core: AssistantCore) {
    core.addEventListener('message', (event, data) => {
      // Track message events
      analytics.track('assistant_message', {
        content: data.content,
        mode: core.getState().currentMode
      });
    });
    
    core.addEventListener('expandedChange', (event, data) => {
      analytics.track('assistant_toggle', { expanded: data.isExpanded });
    });
  },
  
  destroy() {
    // Cleanup
  }
};

// Register plugin
const assistant = new AssistantCore();
assistant.registerPlugin(analyticsPlugin);
```

### Custom Rendering

```tsx
function CustomAssistant() {
  const renderCustomMessage = (message: GenericMessage) => {
    if (message.messageType === 'voice') {
      return (
        <div className="voice-message">
          <AudioPlayer src={message.metadata?.audioUrl} />
          <p>{message.content}</p>
        </div>
      );
    }
    
    if (message.messageType === 'image') {
      return (
        <div className="image-message">
          <img src={message.metadata?.imageUrl} alt="Shared image" />
          <p>{message.content}</p>
        </div>
      );
    }
    
    return null; // Use default rendering
  };
  
  const renderCustomContent = (state: AssistantState) => {
    return (
      <div className="custom-footer">
        <p>Messages: {state.messages.length}</p>
        <p>Mode: {state.currentMode}</p>
      </div>
    );
  };

  return (
    <AssistantWebClient
      messageHandler={handler}
      renderCustomMessage={renderCustomMessage}
      renderCustomContent={renderCustomContent}
    />
  );
}
```

## 🎨 Styling & Theming

### CSS Variables

```css
:root {
  --assistant-primary: #3b82f6;
  --assistant-primary-hover: #2563eb;
  --assistant-surface: #ffffff;
  --assistant-text: #1e293b;
  --assistant-text-secondary: #64748b;
  --assistant-border: #e2e8f0;
  --assistant-border-radius: 16px;
  --assistant-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### Custom Styling

```css
/* Override default styles */
.my-assistant {
  --assistant-primary: #ff6b6b;
  --assistant-surface: #f8f9fa;
  --assistant-border-radius: 12px;
}

.my-assistant .assistant-message {
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
}

.my-assistant .assistant-input {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

### Dark Mode

```tsx
const darkTheme: AssistantTheme = {
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  surface: '#1f2937',
  background: '#111827',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  border: '#374151',
  shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

<AssistantWebClient theme={darkTheme} />
```

## 📱 Mobile Support

The assistant automatically adapts to mobile devices:

```tsx
<AssistantWebClient
  config={{
    // Mobile-optimized settings
    width: window.innerWidth < 768 ? window.innerWidth - 32 : 400,
    height: window.innerHeight < 600 ? window.innerHeight - 100 : 520,
    enableDragging: window.innerWidth >= 768 // Disable dragging on mobile
  }}
/>
```

## 🔧 API Reference

### Components

- `AssistantWebClient` - Main enhanced component with all features
- `TextAssistant` - Text-only conversation mode
- `VoiceAssistant` - Text and voice conversation modes  
- `MultiModalAssistant` - All conversation modes enabled
- `AssistantUI` - Pure UI component (requires core instance)

### Hooks

- `useAssistant` - Main hook for assistant functionality
- `useConversationModes` - Conversation mode management
- `useDragFunctionality` - Drag and drop behavior
- `useVoiceFunctionality` - Voice recording and playback
- `useImageFunctionality` - Image capture and processing
- `useAssistantAnimations` - Animation state management
- `useMessageHandling` - Message queue and processing
- `useAutoScroll` - Auto-scroll to latest messages

### Core Classes

- `AssistantCore` - Framework-agnostic core logic
- Event system with `addEventListener` and `removeEventListener`
- Plugin system with `registerPlugin` and `unregisterPlugin`
- State management with `getState` and `updateState`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by advanced chat interfaces and AI assistants
- Built with React, TypeScript, Framer Motion, and Lucide React
- Designed to be completely generic and domain-agnostic

---

Made with ❤️ by the NextShop Team
