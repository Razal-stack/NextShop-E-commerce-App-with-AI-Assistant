import { useCallback } from 'react';
import { ImageData } from '../components/ImageUploader';

export interface InputHandlers {
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleTextareaInput: (e: React.FormEvent<HTMLTextAreaElement>) => void;
}

export const useInputHandlers = (
  inputValue: string,
  isProcessing: boolean,
  selectedImage: ImageData | null,
  onSendMessage: (message: string, imageData?: ImageData) => void,
  onImageClear: () => void
): InputHandlers => {
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim(), selectedImage || undefined);
      onImageClear(); // Clear image after sending
    }
  }, [inputValue, isProcessing, selectedImage, onSendMessage, onImageClear]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isProcessing) {
        onSendMessage(inputValue.trim(), selectedImage || undefined);
        onImageClear(); // Clear image after sending
      }
    }
  }, [inputValue, isProcessing, selectedImage, onSendMessage, onImageClear]);

  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${Math.max(56, Math.min(target.scrollHeight, 120))}px`;
  }, []);

  return {
    handleSubmit,
    handleKeyPress,
    handleTextareaInput
  };
};
