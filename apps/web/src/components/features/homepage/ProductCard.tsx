'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ProductCard as SharedProductCard } from "@/components/shared";
import { useCartStore, useWishlistStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Product } from "@/types";
import { toast } from "sonner";
import AuthModal from "@/components/shared/AuthModal";

interface ProductCardProps {
  product: Product;
  index: number;
  delay?: number;
  navigationContext?: {
    from: string;
    label: string;
  };
}

export default function ProductCard({ 
  product, 
  index, 
  delay = 0,
  navigationContext
}: ProductCardProps) {
  const { items: cart } = useCartStore(); // Keep for local cart display
  const { addItem: addToWishlist, items: wishlist } = useWishlistStore();
  const { isAuthenticated } = useAuth();
  const { addItem: addToCart } = useCart(); // Use new cart hook for backend sync
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'cart' | 'wishlist'>('cart');

  const getItemQuantity = (productId: number) => {
    const item = cart.find((item: any) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const handleQuantityChange = async (product: Product, change: number) => {
    if (!isAuthenticated) {
      setAuthAction('cart');
      setShowAuthModal(true);
      return;
    }
    if (change > 0) {
      await addToCart(product);
    }
  };

  const handleAddToWishlist = (product: Product) => {
    if (!isAuthenticated) {
      setAuthAction('wishlist');
      setShowAuthModal(true);
      return;
    }
    addToWishlist(product);
    toast.success('Added to wishlist!');
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      setAuthAction('cart');
      setShowAuthModal(true);
      return;
    }
    try {
      await addToCart(product);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item: any) => item.id === productId);
  };

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
        productTitle={product.title}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + index * 0.1 }}
        className="group cursor-pointer"
      >
        <SharedProductCard
          product={product}
          viewMode="grid"
          showCategory={false}
          isInWishlist={isAuthenticated && isInWishlist(product.id)}
          quantity={isAuthenticated ? getItemQuantity(product.id) : 0}
          onWishlistToggle={handleAddToWishlist}
          onQuantityChange={handleQuantityChange}
          onAddToCart={handleAddToCart}
          className="h-full"
          navigationContext={navigationContext}
        />
      </motion.div>
    </>
  );
}
