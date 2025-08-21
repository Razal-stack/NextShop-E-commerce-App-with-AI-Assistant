// packages/ai-assistant/src/components/VoiceInput.tsx
import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onVoiceInput, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onVoiceInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <button
      onClick={handleVoiceInput}
      disabled={disabled}
      className={`p-2 rounded-full transition-colors ${
        isListening 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
