"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, User, Search, Menu, Heart, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUIStore, useCartStore, useWishlistStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { isCartOpen, setCartOpen, isWishlistOpen, setWishlistOpen } =
    useUIStore();
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, isAuthenticated, logout, deleteAccount, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show auth buttons on auth pages
  const isAuthPage = pathname?.startsWith('/auth/');

  // Backup check for authentication state using localStorage
  const [hasTokenInStorage, setHasTokenInStorage] = React.useState(false);
  
  React.useEffect(() => {
    const token = localStorage.getItem('nextshop_token');
    setHasTokenInStorage(!!token);
  }, [isAuthenticated, user]);

  // Final authentication check - use multiple sources
  const finalIsAuthenticated = isAuthenticated || (hasTokenInStorage && user);

  const totalItems = cartItems.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0
  );

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const success = await deleteAccount();
      if (success) {
        router.push('/');
      }
    }
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    
    // Try to get initials from name object first
    if (user.name?.firstname && user.name?.lastname) {
      return `${user.name.firstname[0]}${user.name.lastname[0]}`.toUpperCase();
    }
    
    // Fallback to username
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

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

            {/* Authentication - only show on non-auth pages */}
            {!isAuthPage && (
              <>
                {!isInitialized || isLoading ? (
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-16 h-8 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-20 h-8 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                ) : finalIsAuthenticated && user ? (
                  // Debug: Authenticated user should show avatar dropdown
                  <div className="hidden sm:flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="relative h-8 w-8 rounded-full"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={user.username} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 bg-white border border-slate-200 shadow-xl rounded-lg p-1" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1 px-3 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md mx-1 mb-1">
                            <p className="text-sm font-semibold leading-none text-slate-900">
                              {user.name?.firstname && user.name?.lastname 
                                ? `${user.name.firstname} ${user.name.lastname}`
                                : user.username}
                            </p>
                            <p className="text-xs leading-none text-slate-600">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="border-slate-200 my-1" />
                        
                        <DropdownMenuItem onClick={handleSignOut} className="px-1 py-1 focus:bg-transparent focus:outline-none cursor-pointer">
                          <div className="w-full flex items-center p-3 text-slate-700 hover:bg-slate-50 rounded-md transition-all duration-200 group">
                            <LogOut className="mr-3 h-4 w-4 group-hover:text-blue-600" />
                            <span className="group-hover:text-blue-600">Sign Out</span>
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleDeleteAccount()} className="px-1 py-1 focus:bg-transparent focus:outline-none cursor-pointer">
                          <div className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 group">
                            <Settings className="mr-3 h-4 w-4 group-hover:text-red-700" />
                            <span className="group-hover:text-red-700">Delete Account</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  // Debug: Not authenticated - should show sign in/register buttons
                  <div className="hidden sm:flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      onClick={() => router.push('/auth/signin')}
                    >
                      Sign In
                    </Button>
                    <Button
                      size="sm"
                      className="text-white hover:opacity-90"
                      style={{ background: "var(--brand-gradient)" }}
                      onClick={() => router.push('/auth/register')}
                    >
                      Register
                    </Button>
                  </div>
                )}

                {/* Mobile user dropdown - only show when authenticated and initialized */}
                {isInitialized && finalIsAuthenticated && user && (
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 bg-white border border-slate-200 shadow-xl rounded-lg p-1" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1 px-3 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md mx-1 mb-1">
                            <p className="text-sm font-semibold leading-none text-slate-900">
                              {user.name?.firstname && user.name?.lastname 
                                ? `${user.name.firstname} ${user.name.lastname}`
                                : user.username}
                            </p>
                            <p className="text-xs leading-none text-slate-600">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="border-slate-200 my-1" />
                        
                        <DropdownMenuItem onClick={handleSignOut} className="px-1 py-1 focus:bg-transparent focus:outline-none cursor-pointer">
                          <div className="w-full flex items-center p-3 text-slate-700 hover:bg-slate-50 rounded-md transition-all duration-200 group">
                            <LogOut className="mr-3 h-4 w-4 group-hover:text-blue-600" />
                            <span className="group-hover:text-blue-600">Sign Out</span>
                          </div>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleDeleteAccount()} className="px-1 py-1 focus:bg-transparent focus:outline-none cursor-pointer">
                          <div className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 group">
                            <Settings className="mr-3 h-4 w-4 group-hover:text-red-700" />
                            <span className="group-hover:text-red-700">Delete Account</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            )}

            {/* Wishlist - always show */}
            {!isAuthPage && (
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
            )}

            {/* Cart - always show */}
            {!isAuthPage && (
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
            )}

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
