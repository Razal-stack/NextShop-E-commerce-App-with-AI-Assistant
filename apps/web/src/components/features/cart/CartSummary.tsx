'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingThreshold?: number;
}

export default function CartSummary({ 
  subtotal, 
  shipping, 
  tax, 
  total,
  freeShippingThreshold = 50
}: CartSummaryProps) {
  const needsMoreForFreeShipping = subtotal < freeShippingThreshold;
  const amountNeeded = freeShippingThreshold - subtotal;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Subtotal:</span>
        <span className="font-semibold text-slate-900">
          £{subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Shipping:</span>
        <span className="font-semibold text-slate-900">
          {shipping === 0 ? (
            <span className="text-green-600 font-bold">FREE</span>
          ) : (
            `£${shipping.toFixed(2)}`
          )}
        </span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Tax (VAT 20%):</span>
        <span className="font-semibold text-slate-900">
          £{tax.toFixed(2)}
        </span>
      </div>

      <Separator className="my-3" />

      <div className="flex justify-between text-lg font-bold">
        <span className="text-slate-900">Total:</span>
        <span className="text-brand-600">£{total.toFixed(2)}</span>
      </div>

      {needsMoreForFreeShipping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-gradient-to-r from-brand-50 to-emerald-50 rounded-xl border border-brand-100 mt-4"
        >
          <div className="flex items-center justify-center space-x-2">
            <Truck className="w-4 h-4 text-brand-600" />
            <p className="text-sm font-medium text-brand-700">
              Add £{amountNeeded.toFixed(2)} more for free shipping!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
