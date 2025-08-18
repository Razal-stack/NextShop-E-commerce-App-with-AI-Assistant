"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, User, Search, Menu, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useUIStore, useCartStore, useWishlistStore } from "../lib/store";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { isCartOpen, setCartOpen, isWishlistOpen, setWishlistOpen } =
    useUIStore();
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const router = useRouter();
  const pathname = usePathname();

  const totalItems = cartItems.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div
              className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center relative overflow-hidden brand-glow"
              style={{ background: "var(--brand-gradient)" }}
            >
              <span className="text-white font-bold text-sm">N</span>
              <div className="absolute inset-0 ai-shimmer"></div>
            </div>
            <span
              className="text-xl font-semibold"
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              NextShop
            </span>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Button
              variant={pathname === "/" ? "default" : "ghost"}
              onClick={() => router.push("/")}
              className={
                pathname === "/" 
                  ? "text-white hover:opacity-90" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
              style={
                pathname === "/" ? { background: "var(--brand-gradient)" } : {}
              }
            >
              Home
            </Button>
            <Button
              variant={pathname === "/products" ? "default" : "ghost"}
              onClick={() => router.push("/products")}
              className={
                pathname === "/products"
                  ? "text-white hover:opacity-90"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
              style={
                pathname === "/products"
                  ? { background: "var(--brand-gradient)" }
                  : {}
              }
            >
              Products
            </Button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search (on mobile, shows only icon) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Sign In / Register */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="text-white hover:opacity-90"
                style={{ background: "var(--brand-gradient)" }}
              >
                Register
              </Button>
            </div>

            {/* Mobile user icon */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <User className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWishlistOpen(true)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs text-white"
                      style={{
                        background: "var(--brand-gradient)",
                      }}
                    >
                      {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Cart */}
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCartOpen(true)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs text-white"
                      style={{
                        background: "var(--brand-gradient)",
                      }}
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="btn-ghost md:hidden text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
