'use client';

import React, { useState } from 'react';
import { ProductCard as SharedProductCard } from '@/components/shared';
import { useCartStore, useWishlistStore } from '@/lib/store';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types';
import { toast } from 'sonner';
import AuthModal from '@/components/shared/AuthModal';

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const { addItem: addToCart, updateQuantity } = useCart(); // Use unified cart hook for backend sync
  const { items: cart } = useCartStore(); // Keep for local cart display
  const { addItem: addToWishlist, items: wishlist } = useWishlistStore();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'cart' | 'wishlist'>('cart');

  const handleAddToWishlist = (product: Product) => {
    if (!isAuthenticated) {
      setAuthAction('wishlist');
      setShowAuthModal(true);
      return;
    }
    addToWishlist(product);
    toast.success('Added to wishlist!');
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item: any) => item.id === productId);
  };

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
    
    const currentQuantity = getItemQuantity(product.id);
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      return;
    }

    if (currentQuantity === 0 && change > 0) {
      await addToCart(product);
    } else {
      await updateQuantity(product.id, newQuantity);
    }
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
  };  return (
    <>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
        productTitle={product.title}
      />
      
      <SharedProductCard
        product={product}
        viewMode={viewMode}
        showDescription={viewMode === 'list'}
        isInWishlist={isAuthenticated && isInWishlist(product.id)}
        quantity={isAuthenticated ? getItemQuantity(product.id) : 0}
        onWishlistToggle={handleAddToWishlist}
        onQuantityChange={handleQuantityChange}
        onAddToCart={handleAddToCart}
        navigationContext={{
          from: '/products',
          label: 'Back to Products'
        }}
      />
    </>
  );
}
