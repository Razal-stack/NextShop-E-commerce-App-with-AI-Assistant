'use client';

import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  ShoppingCart,
  ArrowRight,
  Bookmark,
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Badge } from './ui/badge';
import { useUIStore, useWishlistStore, useCartStore } from '../lib/store';
import ImageWithFallback from './handlers/ImageWithFallback';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function Wishlist() {
  const { isWishlistOpen, setWishlistOpen } = useUIStore();
  const { items: wishlist, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const router = useRouter();

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
    toast.success('Item removed from wishlist');
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`);
    setWishlistOpen(false);
  };

  return (
    <Sheet open={isWishlistOpen} onOpenChange={setWishlistOpen}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col bg-white border-none shadow-2xl h-full max-h-screen">
        <SheetHeader className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <SheetTitle className="flex items-center space-x-3 text-xl font-semibold text-slate-900">
            <div className="p-2 bg-red-50 rounded-lg">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
            </div>
            <span>Wishlist</span>
            {wishlist.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 border-none">
                {wishlist.length} items
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {wishlist.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 bg-gradient-to-br from-red-50 to-pink-100 rounded-full flex items-center justify-center mb-6 shadow-sm"
            >
              <Heart className="w-12 h-12 text-red-400 fill-current" />
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Your wishlist is empty</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">Save products you love to your wishlist and never lose track of them!</p>
            <Button 
              onClick={() => setWishlistOpen(false)}
              className="px-8 py-3 btn-primary"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Wishlist Items - Fixed Height with Scroll */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full px-6 py-2 overflow-y-auto scrollbar-thin">
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {wishlist.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex space-x-4 p-4 rounded-xl border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all duration-200 bg-white"
                      >
                      <div 
                        className="flex-shrink-0 cursor-pointer group"
                        onClick={() => handleViewProduct(item.id)}
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-100 group-hover:border-brand-300 transition-colors duration-200"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold text-slate-900 line-clamp-2 mb-2 leading-snug cursor-pointer hover:text-brand-600 transition-colors duration-200"
                          onClick={() => handleViewProduct(item.id)}
                        >
                          {item.title}
                        </h4>
                        <p className="text-lg font-bold text-brand-600 mb-3">
                          £{item.price.toFixed(2)}
                        </p>
                        
                        {/* Action Row - Add to Cart and Remove */}
                        <div className="flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-destructive px-3 py-1"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Remove
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="btn-primary px-4 py-2"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>

                      {/* No separate remove button needed */}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            </div>

            {/* Wishlist Footer - Fixed at bottom */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Bookmark className="w-4 h-4 text-slate-500" />
                    <p className="text-sm text-slate-600">
                      {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved for later
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setWishlistOpen(false)}
                    className="w-full h-12 btn-primary"
                  >
                    Continue Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}