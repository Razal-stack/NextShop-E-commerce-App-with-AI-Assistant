import { useState, useCallback } from 'react';
import { ImageData } from '../components/ImageUploader';

export interface ImageState {
  selectedImage: ImageData | null;
}

export interface ImageHandlers {
  handleImageSelect: (imageData: ImageData) => void;
  handleImageRemove: () => void;
  handleImageClick: () => void;
  cleanup: () => void;
}

export const useImageManagement = (
  onImageClick?: () => void
): ImageState & ImageHandlers => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const handleImageClick = useCallback(() => {
    onImageClick?.();
    // ImageUploader handles the file selection directly
  }, [onImageClick]);

  const handleImageSelect = useCallback((imageData: ImageData) => {
    console.log('📷 Image selected:', imageData.file.name);
    setSelectedImage(imageData);
  }, []);

  const handleImageRemove = useCallback(() => {
    console.log('📷 Image removed');
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
  }, [selectedImage]);

  // Cleanup function for reset
  const cleanup = useCallback(() => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
  }, [selectedImage]);

  return {
    // State
    selectedImage,
    
    // Handlers
    handleImageSelect,
    handleImageRemove,
    handleImageClick,
    
    // Cleanup (for reset functionality)
    cleanup
  };
};
