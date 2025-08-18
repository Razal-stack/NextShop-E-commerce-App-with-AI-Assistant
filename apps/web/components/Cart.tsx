'use client';

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Truck,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useUIStore, useCartStore } from "../lib/store";
import ImageWithFallback from "./handlers/ImageWithFallback";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Cart() {
  const { isCartOpen, setCartOpen } = useUIStore();
  const { items: cart, updateQuantity, removeItem } = useCartStore();
  const router = useRouter();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 4.99;
  const tax = subtotal * 0.2; // 20% VAT
  const total = subtotal + shipping + tax;

  const handleUpdateQuantity = (
    productId: number,
    quantity: number,
  ) => {
    updateQuantity(productId, quantity);
    if (quantity === 0) {
      toast.success("Item removed from cart");
    }
  };

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
    toast.success("Item removed from cart");
  };

  const handleCheckout = () => {
    toast.success("Proceeding to checkout...");
    // In a real app, this would redirect to checkout
  };

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`);
    setCartOpen(false);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col bg-white border-none shadow-2xl h-full max-h-screen">
        <SheetHeader className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <SheetTitle className="flex items-center space-x-3 text-xl font-semibold text-slate-900">
            <div className="p-2 bg-brand-50 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
            </div>
            <span>Shopping Cart</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-brand-100 text-brand-700 border-none">
                {cart.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                )}{" "}
                items
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 bg-gradient-to-br from-brand-50 to-brand-100 rounded-full flex items-center justify-center mb-6 shadow-sm"
            >
              <ShoppingBag className="w-12 h-12 text-brand-500" />
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Your cart is empty
            </h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Add some amazing products to get started on your shopping journey!
            </p>
            <Button 
              onClick={() => setCartOpen(false)}
              className="btn-primary px-8 py-3 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items - Fixed Height with Scroll */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full px-6 py-2 overflow-y-auto scrollbar-thin">
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
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
                        <p className="text-sm text-green-600 font-medium mb-3">
                          £{item.price.toFixed(2)} each
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 btn-secondary"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                )
                              }
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-700">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 btn-secondary"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-lg text-brand-600">
                              £{(item.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 btn-icon-delete"
                              onClick={() =>
                                handleRemoveItem(item.id)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            </div>

            {/* Cart Summary - Fixed at bottom */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Subtotal:
                  </span>
                  <span className="font-semibold text-slate-900">
                    £{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Shipping:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-bold">
                        FREE
                      </span>
                    ) : (
                      `£${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Tax (VAT 20%):
                  </span>
                  <span className="font-semibold text-slate-900">
                    £{tax.toFixed(2)}
                  </span>
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-brand-600">
                    £{total.toFixed(2)}
                  </span>
                </div>
              </div>

              {subtotal < 50 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 bg-gradient-to-r from-brand-50 to-emerald-50 rounded-xl mb-6 border border-brand-100"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Truck className="w-4 h-4 text-brand-600" />
                    <p className="text-sm font-medium text-brand-700">
                      Add £{(50 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleCheckout}
                  className="btn-primary w-full text-white h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setCartOpen(false)}
                  className="btn-secondary w-full font-medium transition-all duration-200"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}