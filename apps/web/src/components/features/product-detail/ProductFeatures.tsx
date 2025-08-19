'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Truck, RotateCcw } from 'lucide-react';

export default function ProductFeatures() {
  const features = [
    {
      icon: Truck,
      text: "Free shipping on orders over £50"
    },
    {
      icon: RotateCcw,
      text: "30-day return policy"
    },
    {
      icon: Shield,
      text: "2-year warranty included"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      {features.map((feature, index) => (
        <div key={index} className="flex items-center space-x-3 text-slate-600">
          <feature.icon className="w-5 h-5" />
          <span>{feature.text}</span>
        </div>
      ))}
    </motion.div>
  );
}
