import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceRecordingState {
  isVoiceMode: boolean;
  voiceState: 'idle' | 'recording' | 'transcribed' | 'error';
  transcribedText: string;
  voiceError: string;
}

export interface VoiceRecordingHandlers {
  handleVoiceClick: (currentInput: string, onInputChange: (value: string) => void, onImageClear: () => void) => void;
  startVoiceRecording: () => void;
  stopVoiceRecording: () => void;
  confirmVoiceTranscription: (onInputChange: (value: string) => void) => void;
  cancelVoiceRecording: () => void;
  cleanup: () => void;
}

export const useVoiceRecording = (): VoiceRecordingState & VoiceRecordingHandlers => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'transcribed' | 'error'>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  
  const recognitionRef = useRef<any>(null);

  const handleVoiceClick = useCallback((
    currentInput: string, 
    onInputChange: (value: string) => void, 
    onImageClear: () => void
  ) => {
    if (!isVoiceMode) {
      // Always clear input and image when starting voice recording
      onInputChange('');
      onImageClear();
      
      // Enter voice recording mode and start recording immediately
      setIsVoiceMode(true);
      setVoiceState('recording'); // Go directly to recording state
      setTranscribedText('');
      setVoiceError('');
    }
  }, [isVoiceMode]);

  const startVoiceRecording = useCallback(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      setVoiceState('error');
      return;
    }

    // Don't start if already recording
    if (recognitionRef.current) {
      console.log('🎤 Already recording, skipping start');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Voice recording started');
      setVoiceState('recording');
      setVoiceError('');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎤 Voice transcript:', transcript);
      
      if (transcript && transcript.trim()) {
        setTranscribedText(transcript);
        setVoiceState('transcribed');
      } else {
        // If no valid transcript, just exit voice mode
        setIsVoiceMode(false);
        setVoiceState('recording');
        setTranscribedText('');
        setVoiceError('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      
      // For certain errors, just exit silently without showing error UI
      if (event.error === 'aborted' || event.error === 'not-allowed') {
        console.log('🎤 Recording aborted or not allowed, exiting silently');
        setIsVoiceMode(false);
        setVoiceState('recording');
        setTranscribedText('');
        setVoiceError('');
        recognitionRef.current = null;
        return;
      }
      
      // For "no-speech" errors, also exit silently to prevent "sorry" messages
      if (event.error === 'no-speech') {
        console.log('🎤 No speech detected, exiting voice mode silently');
        setIsVoiceMode(false);
        setVoiceState('recording');
        setTranscribedText('');
        setVoiceError('');
        recognitionRef.current = null;
        return;
      }
      
      // Only show error UI for actual technical errors
      let errorMessage = 'Voice recognition failed. Please try again.';
      if (event.error === 'network') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (event.error === 'service-not-allowed') {
        errorMessage = 'Speech recognition service not available.';
      }
      
      console.log('🎤 Showing error UI:', errorMessage);
      setVoiceError(errorMessage);
      setVoiceState('error');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log('🎤 Voice recording ended');
      recognitionRef.current = null;
      // Don't automatically exit voice mode - let the user decide
      // This prevents issues where recording ends prematurely
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      console.log('🎤 Starting speech recognition...');
    } catch (error) {
      console.error('🎤 Failed to start recognition:', error);
      setVoiceError('Failed to start voice recording. Please try again.');
      setVoiceState('error');
      recognitionRef.current = null;
    }
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      console.log('🎤 Stopping voice recording');
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    // Don't change state here - let the result or error handlers deal with it
  }, []);

  const confirmVoiceTranscription = useCallback((onInputChange: (value: string) => void) => {
    // Only proceed if we actually have transcribed text
    if (!transcribedText.trim()) {
      console.log('🎤 No transcribed text to confirm, exiting voice mode');
      // If no text was transcribed, just exit voice mode silently
      setIsVoiceMode(false);
      setVoiceState('recording');
      setTranscribedText('');
      setVoiceError('');
      return;
    }
    
    console.log('🎤 Confirming voice transcription:', transcribedText);
    // Replace input entirely with transcribed text (input was already cleared on start)
    onInputChange(transcribedText.trim());
    
    // Exit voice mode and return to normal chat interface
    setIsVoiceMode(false);
    setVoiceState('recording');
    setTranscribedText('');
    setVoiceError('');
  }, [transcribedText]);

  const cancelVoiceRecording = useCallback(() => {
    // Stop any active recognition
    if (recognitionRef.current) {
      console.log('🎤 Cancelling voice recording');
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    // Exit voice mode and return to original state
    // No messages, no notifications - just go back to where we were
    setIsVoiceMode(false);
    setVoiceState('recording');
    setTranscribedText('');
    setVoiceError('');
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsVoiceMode(false);
    setVoiceState('recording');
    setTranscribedText('');
    setVoiceError('');
  }, []);

  // Auto-start recording when voice mode is activated
  useEffect(() => {
    if (isVoiceMode && voiceState === 'recording' && !recognitionRef.current) {
      startVoiceRecording();
    }
  }, [isVoiceMode, voiceState, startVoiceRecording]);

  return {
    // State
    isVoiceMode,
    voiceState,
    transcribedText,
    voiceError,
    
    // Handlers
    handleVoiceClick,
    startVoiceRecording,
    stopVoiceRecording,
    confirmVoiceTranscription,
    cancelVoiceRecording,
    
    // Cleanup (for reset functionality)
    cleanup
  };
};
