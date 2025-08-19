'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = "text-brand-500",
  gradientFrom = "from-brand-50",
  gradientTo = "to-brand-100"
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-24 h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full flex items-center justify-center mb-6 shadow-sm`}
      >
        <Icon className={`w-12 h-12 ${iconColor}`} />
      </motion.div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">
        {title}
      </h3>
      <p className="text-slate-600 mb-8 leading-relaxed">
        {description}
      </p>
      <Button 
        onClick={onAction}
        className="btn-primary px-8 py-3 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
