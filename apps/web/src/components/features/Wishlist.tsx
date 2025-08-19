'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUIStore, useWishlistStore, useCartStore } from '@/lib/store';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { EmptyState, ListHeader } from '@/components/shared';
import { WishlistItems, WishlistActions } from './wishlist/index';
import AuthModal from '@/components/shared/AuthModal';

export default function Wishlist() {
  const { isWishlistOpen, setWishlistOpen } = useUIStore();
  const { items: wishlist, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCart(); // Use unified cart hook for backend sync
  const { items: cart } = useCartStore(); // Keep for local cart display
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
    toast.success('Item removed from wishlist');
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product);
      
      // Remove item from wishlist after successfully adding to cart
      removeItem(product.id);
      
      toast.success('Added to cart and removed from wishlist!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`);
    setWishlistOpen(false);
  };

  const handleContinueShopping = () => {
    setWishlistOpen(false);
  };

  // Don't show auth modal when wishlist is opened - always show the drawer
  // React.useEffect(() => {
  //   if (isWishlistOpen && !isAuthenticated) {
  //     setShowAuthModal(true);
  //     setWishlistOpen(false);
  //   }
  // }, [isWishlistOpen, isAuthenticated, setWishlistOpen]);

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="wishlist"
      />
      
      <Sheet open={isWishlistOpen} onOpenChange={setWishlistOpen}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col bg-white border-none shadow-2xl h-full max-h-screen">
        <SheetHeader className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <SheetTitle>
            <ListHeader
              icon={Heart}
              title="Wishlist"
              itemCount={wishlist.length}
              badgeColor="bg-red-100 text-red-700"
              iconBgColor="bg-red-50"
              iconColor="text-red-500 fill-current"
            />
          </SheetTitle>
        </SheetHeader>

        {!isAuthenticated ? (
          <EmptyState
            icon={Heart}
            title="Sign in to view your wishlist"
            description="Please sign in to your account to save products you love and never lose track of them!"
            actionLabel="Sign In"
            onAction={() => {
              setWishlistOpen(false);
              router.push('/auth/signin');
            }}
            iconColor="text-red-400 fill-current"
            gradientFrom="from-red-50"
            gradientTo="to-pink-100"
          />
        ) : wishlist.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save products you love to your wishlist and never lose track of them!"
            actionLabel="Continue Shopping"
            onAction={handleContinueShopping}
            iconColor="text-red-400 fill-current"
            gradientFrom="from-red-50"
            gradientTo="to-pink-100"
          />
        ) : (
          <>
            {/* Wishlist Items */}
            <WishlistItems
              items={wishlist}
              onItemClick={(item: any) => handleViewProduct(item.id)}
              onAddToCart={handleAddToCart}
              onRemoveItem={handleRemoveItem}
            />

            {/* Wishlist Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <WishlistActions
                itemCount={wishlist.length}
                onContinueShopping={handleContinueShopping}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}