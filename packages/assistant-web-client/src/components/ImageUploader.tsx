'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Upload } from 'lucide-react';

// Import styles

// ==================== TYPES ====================

export interface ImageUploaderProps {
  onImageSelect: (imageData: ImageData) => void;
  onImageRemove: () => void;
  selectedImage?: ImageData | null;
  disabled?: boolean;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
}

export interface ImageData {
  file: File;
  preview: string;
  base64: string;
}

// ==================== IMAGE UPLOADER COMPONENT ====================

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  onImageRemove,
  selectedImage = null,
  disabled = false,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Process selected file
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);

    try {
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        const maxSizeMB = maxSizeBytes / (1024 * 1024);
        throw new Error(`Image size should be less than ${maxSizeMB}MB.`);
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      const imageData: ImageData = {
        file,
        preview,
        base64
      };

      onImageSelect(imageData);
      console.log('📷 Image uploaded:', file.name, file.type, file.size);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image.';
      setError(errorMessage);
      console.error('📷 Image upload error:', errorMessage);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [acceptedTypes, maxSizeBytes, onImageSelect]);

  // Handle image removal
  const handleRemoveImage = useCallback(() => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    onImageRemove();
    setError('');
  }, [selectedImage, onImageRemove]);

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Image Upload Button */}
      {!selectedImage && (
        <motion.button
          type="button"
          onClick={handleFileSelect}
          disabled={disabled || isUploading}
          className={`
            h-8 w-8 p-0 rounded-full transition-colors duration-200 
            flex items-center justify-center border-0 bg-transparent
            ${disabled || isUploading 
              ? 'text-slate-400 cursor-not-allowed' 
              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
            }
          `}
          whileHover={!disabled && !isUploading ? { scale: 1.1 } : {}}
          whileTap={!disabled && !isUploading ? { scale: 0.9 } : {}}
          title="Upload image"
        >
          {isUploading ? (
            <motion.div
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </motion.button>
      )}

      {/* Selected Image Display */}
      {selectedImage && (
        <motion.div
          className="relative inline-flex items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {/* Image thumbnail */}
          <div className="relative group">
            <motion.img
              src={selectedImage.preview}
              alt={selectedImage.file.name}
              className="w-8 h-8 rounded object-cover border-2 border-blue-200 shadow-sm bg-white"
              whileHover={{ scale: 1.05 }}
            />
            
            {/* Remove button */}
            <motion.button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-md border border-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Remove image"
            >
              <X className="w-2.5 h-2.5" />
            </motion.button>
            
            {/* Upload success indicator */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center">
              <motion.div 
                className="w-1.5 h-1.5 bg-white rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              />
            </div>
          </div>

          {/* Image info tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
              {selectedImage.file.name} ({Math.round(selectedImage.file.size / 1024)}KB)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 whitespace-nowrap z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3 inline" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== IMAGE PREVIEW COMPONENT ====================

export interface ImagePreviewProps {
  imageData: ImageData;
  onRemove: () => void;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageData,
  onRemove,
  size = 'md',
  showInfo = true
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${Math.round(kb)}KB`;
  };

  return (
    <motion.div
      className="relative inline-block group"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {/* Image */}
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm bg-white`}>
        <img
          src={imageData.preview}
          alt={imageData.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Remove button */}
      <motion.button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Remove image"
      >
        <X className="w-3 h-3" />
      </motion.button>

      {/* Image info */}
      {showInfo && (
        <div className="absolute inset-x-0 bottom-0 bg-black/75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="truncate">{imageData.file.name}</div>
          <div>{formatFileSize(imageData.file.size)}</div>
        </div>
      )}
    </motion.div>
  );
};

export default ImageUploader;
