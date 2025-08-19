'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityControlsProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'sm' | 'md';
}

export default function QuantityControls({ 
  quantity, 
  onIncrease, 
  onDecrease,
  size = 'sm'
}: QuantityControlsProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textClass = size === 'sm' ? 'w-8 text-center text-sm font-semibold' : 'w-12 text-center font-medium';

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        className={`${sizeClass} btn-secondary`}
        onClick={onDecrease}
      >
        <Minus className={iconClass} />
      </Button>
      <span className={`${textClass} text-slate-700`}>
        {quantity}
      </span>
      <Button
        variant="outline"
        size="icon"
        className={`${sizeClass} btn-secondary`}
        onClick={onIncrease}
      >
        <Plus className={iconClass} />
      </Button>
    </div>
  );
}
