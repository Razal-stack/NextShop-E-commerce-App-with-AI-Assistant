'use client';

import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore, useCartStore, useUserStore } from "@/lib/store";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState, ListHeader } from "@/components/shared";
import { CartItems, CartSummary, CartActions } from "./cart/index";
import AuthModal from "@/components/shared/AuthModal";

export default function Cart() {
  const { isCartOpen, setCartOpen } = useUIStore();
  const { items: cart } = useCartStore(); // Keep for display only
  const { 
    updateQuantity, 
    removeItem
  } = useCart(); // Use unified cart hook for operations
  
  // SINGLE SOURCE OF TRUTH for authentication - UserStore only
  const { isAuthenticated: isAuthenticatedFn } = useUserStore();
  const isAuthenticated = isAuthenticatedFn();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 4.99;
  const tax = subtotal * 0.2; // 20% VAT
  const total = subtotal + shipping + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    await updateQuantity(productId, quantity);
    if (quantity === 0) {
      toast.success("Item removed from cart");
    }
  };

  const handleRemoveItem = async (productId: number) => {
    await removeItem(productId);
    toast.success("Item removed from cart");
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    toast.success("Proceeding to checkout...");
    // In a real app, this would redirect to checkout
  };

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`);
    setCartOpen(false);
  };

  const handleContinueShopping = () => {
    setCartOpen(false);
  };

  // Don't show auth modal when cart is opened - always show the drawer
  // React.useEffect(() => {
  //   if (isCartOpen && !isAuthenticated) {
  //     setShowAuthModal(true);
  //     setCartOpen(false);
  //   }
  // }, [isCartOpen, isAuthenticated, setCartOpen]);

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="cart"
      />
      
      <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col bg-white border-none shadow-2xl h-full max-h-screen">
        <SheetHeader className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <SheetTitle>
            <ListHeader
              icon={ShoppingBag}
              title="Shopping Cart"
              itemCount={totalItems}
            />
          </SheetTitle>
        </SheetHeader>

        {!isAuthenticated ? (
          <EmptyState
            icon={ShoppingBag}
            title="Sign in to view your cart"
            description="Please sign in to your account to add items to your cart and start shopping!"
            actionLabel="Sign In"
            onAction={() => {
              setCartOpen(false);
              router.push('/auth/signin');
            }}
          />
        ) : cart.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add some amazing products to get started on your shopping journey!"
            actionLabel="Continue Shopping"
            onAction={handleContinueShopping}
          />
        ) : (
          <>
            {/* Cart Items */}
            <CartItems
              items={cart as any}
              onItemClick={(item: any) => handleViewProduct(item.id)}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />

            {/* Cart Summary - Fixed at bottom */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <CartSummary
                subtotal={subtotal}
                shipping={shipping}
                tax={tax}
                total={total}
              />

              <CartActions
                onCheckout={handleCheckout}
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