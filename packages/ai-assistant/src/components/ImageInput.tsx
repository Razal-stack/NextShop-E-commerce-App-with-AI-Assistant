// packages/ai-assistant/src/components/ImageInput.tsx
import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface ImageInputProps {
  onImageInput: (base64: string) => void;
  disabled?: boolean;
}

export function ImageInput({ onImageInput, disabled = false }: ImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageInput(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={`p-2 rounded-full transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Upload image"
      >
        <Camera className="w-4 h-4" />
      </button>
    </div>
  );
}
