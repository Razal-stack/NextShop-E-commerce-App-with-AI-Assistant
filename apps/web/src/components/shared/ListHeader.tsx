'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ListHeaderProps {
  icon: React.ElementType;
  title: string;
  itemCount?: number;
  badgeColor?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export default function ListHeader({
  icon: Icon,
  title,
  itemCount,
  badgeColor = "bg-brand-100 text-brand-700",
  iconBgColor = "bg-brand-50",
  iconColor = "text-brand-600"
}: ListHeaderProps) {
  return (
    <div className="flex items-center space-x-3 text-xl font-semibold text-slate-900">
      <div className={`p-2 ${iconBgColor} rounded-lg`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span>{title}</span>
      {itemCount !== undefined && itemCount > 0 && (
        <Badge variant="secondary" className={`ml-2 ${badgeColor} border-none`}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Badge>
      )}
    </div>
  );
}
