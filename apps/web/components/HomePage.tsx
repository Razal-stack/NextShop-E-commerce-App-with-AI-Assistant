'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  Mic,
  Camera,
  ArrowRight,
  Star,
  TrendingUp,
  ShoppingBag,
  Grid3X3,
  Smartphone,
  Shirt,
  User,
  Gem,
  Eye,
  PoundSterling,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Heart,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import ImageWithFallback from "./handlers/ImageWithFallback";
import { useUIStore, useCartStore, useWishlistStore } from "@/lib/store";
import { Product } from "@/lib/types";
import { toast } from "sonner";

const typewriterTexts = [
  "Hi! I'm Nex, your Shopping Assistant",
  "Ask me: 'Find products under £50'",
  "Try: 'Show me 5-star electronics'",
  "Say: 'What's trending in fashion?'",
  "Ask: 'Compare similar products for me'",
  "Try: 'Find gifts for birthdays'",
  "I can help you find anything!",
];

const nexUsageSteps = [
  {
    title: "Ask Questions",
    description: "Type or speak your product queries",
    icon: "💬",
    image:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop",
  },
  {
    title: "Voice Search",
    description: "Use voice commands to find products",
    icon: "🎤",
    image:
      "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=300&fit=crop",
  },
  {
    title: "Image Search",
    description: "Upload images to find similar products",
    icon: "📸",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
  },
  {
    title: "Smart Results",
    description: "Get personalized recommendations",
    icon: "✨",
    image:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
  },
];

export default function HomePage() {
  const uiStore = useUIStore() as any;
  const { addItem: addToCart, items: cart } = useCartStore();
  const { addItem: addToWishlist, items: wishlist } = useWishlistStore();
  const products = uiStore.products || [];
  const router = useRouter();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await fetch('https://fakestoreapi.com/products');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched products:', data); // Debug log
          uiStore.setProducts(data);
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentText = typewriterTexts[currentTextIndex];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        setDisplayedText(currentText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        setTimeout(() => {
          setCurrentTextIndex(
            (prev) => (prev + 1) % typewriterTexts.length,
          );
          setDisplayedText("");
          setIsTyping(true);
        }, 3000);
        clearInterval(typeInterval);
      }
    }, 60);

    return () => clearInterval(typeInterval);
  }, [currentTextIndex]);

  // Usage steps carousel
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(
        (prev) => (prev + 1) % nexUsageSteps.length,
      );
    }, 4000);

    return () => clearInterval(stepInterval);
  }, []);

  // Get products for sections
  const featuredProducts = products.slice(0, 4);
  const topRatedProducts = products
    .filter((p: Product) => p.rating.rate >= 4)
    .slice(0, 4);
  const budgetProducts = products
    .filter((p: Product) => p.price <= 25)
    .slice(0, 4);

  // 4 categories with specific colors
  const categories = [
    {
      name: "Electronics",
      icon: Smartphone,
      count: products.filter(
        (p: Product) => p.category === "electronics",
      ).length,
      bgColor: "bg-gradient-to-r from-purple-500 to-purple-600",
      category: "electronics",
    },
    {
      name: "Men's Clothing",
      icon: User,
      count: products.filter(
        (p: Product) => p.category === "men's clothing",
      ).length,
      bgColor:
        "bg-gradient-to-r from-emerald-500 to-emerald-600",
      category: "men's clothing",
    },
    {
      name: "Women's Clothing",
      icon: Shirt,
      count: products.filter(
        (p: Product) => p.category === "women's clothing",
      ).length,
      bgColor: "bg-gradient-to-r from-pink-400 to-pink-500",
      category: "women's clothing",
    },
    {
      name: "Jewelry",
      icon: Gem,
      count: products.filter((p: Product) => p.category === "jewelery")
        .length,
      bgColor: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      category: "jewelery",
    },
  ];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    console.log("Message sent:", inputText);
    setInputText("");
    router.push("/products");
  };

  const getItemQuantity = (productId: number) => {
    const item = cart.find((item: any) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const handleQuantityChange = (
    product: Product,
    change: number,
  ) => {
    if (change > 0) {
      addToCart(product);
    }
  };

  const handleAddToWishlist = (product: Product) => {
    addToWishlist(product);
    toast.success('Added to wishlist!');
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some((item: any) => item.id === productId);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30">
      {/* Hero Section - Nex Shopping Assistant */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main Nex Widget */}
            <Card className="relative overflow-hidden border-0 shadow-2xl brand-glow bg-white/80 backdrop-blur-md">
              <CardContent className="p-8 sm:p-12">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                  {/* Left side - Nex Introduction */}
                  <div className="space-y-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center space-x-4"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden pulse-brand"
                        style={{ background: "var(--brand-gradient)" }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Sparkles className="w-8 h-8 text-white" />
                        </motion.div>
                        <div className="absolute inset-0 ai-shimmer"></div>
                      </div>
                      <div>
                        <h1
                          className="text-4xl sm:text-5xl font-bold"
                          style={{
                            background: "var(--brand-gradient)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          Meet Nex
                        </h1>
                        <p className="text-lg text-slate-600 mt-1">
                          Your Shopping Assistant
                        </p>
                      </div>
                    </motion.div>

                    {/* Typewriter text with fixed height */}
                    <div className="h-20 flex items-center">
                      <motion.p
                        key={currentTextIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl sm:text-2xl text-slate-700 leading-relaxed"
                      >
                        {displayedText}
                        {isTyping && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                            }}
                            className="ml-1 text-blue-600"
                          >
                            |
                          </motion.span>
                        )}
                      </motion.p>
                    </div>

                    {/* Direct Interaction Area */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                        <Input
                          placeholder="Ask Nex anything about products..."
                          value={inputText}
                          onChange={(e) =>
                            setInputText(e.target.value)
                          }
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            handleSendMessage()
                          }
                          className="border-0 focus:ring-0 bg-transparent"
                        />
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="btn-ghost h-8 w-8 text-slate-500"
                            title="Voice search"
                          >
                            <Mic className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="btn-ghost h-8 w-8 text-slate-500"
                            title="Image search"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={handleSendMessage}
                            size="icon"
                            className="btn-primary h-8 w-8 text-white"
                            disabled={!inputText.trim()}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Capabilities and Browse Products in one line */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-3">
                          <Badge
                            variant="secondary"
                            className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            <Mic className="w-3 h-3 mr-1" />
                            Voice
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="px-3 py-1 bg-purple-50 text-purple-700 border-purple-200"
                          >
                            <Camera className="w-3 h-3 mr-1" />
                            Image
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Smart
                          </Badge>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => router.push("/products")}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Browse Products</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Smart Usage Tutorial Carousel */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative"
                  >
                    <div className="w-full h-80 rounded-3xl overflow-hidden relative bg-gradient-to-br from-blue-100 to-blue-100">
                      {nexUsageSteps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity:
                              index === currentStepIndex
                                ? 1
                                : 0,
                            scale:
                              index === currentStepIndex
                                ? 1
                                : 1.05,
                          }}
                          transition={{ duration: 0.8 }}
                          className="absolute inset-0"
                        >
                          <ImageWithFallback
                            src={step.image}
                            alt={step.title}
                            width={400}
                            height={320}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent"></div>
                          <div className="absolute bottom-8 left-8 text-white">
                            <div className="text-4xl mb-2">
                              {step.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                              {step.title}
                            </h3>
                            <p className="text-blue-100">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {/* Step indicators */}
                      <div className="absolute bottom-4 right-8 flex space-x-2">
                        {nexUsageSteps.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentStepIndex
                                ? "bg-white w-8"
                                : "bg-white/50"
                            }`}
                            onClick={() =>
                              setCurrentStepIndex(index)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Widgets Section */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories and Top Rated Row */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Categories Widget - 4 categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-md">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-slate-800">
                      Shop by Category
                    </h3>
                    <Grid3X3 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-8">
                    {categories.map((category, index) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.3 + index * 0.1,
                        }}
                        className={`group relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${category.bgColor}`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onClick={() => router.push("/products")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                              <category.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white">
                                {category.name}
                              </h4>
                              <p className="text-white/80 text-sm">
                                {category.count} products
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Rated Products - Custom background */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card
                className="h-full overflow-hidden border-0 shadow-xl"
                style={{ backgroundColor: "#fff7f2" }}
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-slate-800">
                      Top Rated
                    </h3>
                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  </div>
                  <div className="space-y-4">
                    {topRatedProducts.map((product: Product, index: number) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.5 + index * 0.1,
                        }}
                        className="flex items-center space-x-4 p-4 rounded-xl hover:bg-orange-50/50 transition-all cursor-pointer group"
                        whileHover={{ scale: 1.01 }}
                        onClick={() =>
                          router.push(`/products/${product.id}`)
                        }
                      >
                        <div className="relative overflow-hidden rounded-lg">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-700">
                            {product.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-slate-600 ml-1">
                                {product.rating.rate}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              £{product.price}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Budget Picks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <Card
              className="overflow-hidden border-0 shadow-xl"
              style={{ backgroundColor: "#f2f7ff" }}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <PoundSterling className="w-8 h-8 text-green-600" />
                    <h3 className="text-2xl font-bold text-slate-800">
                      Budget Picks Under £25
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View All</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
                  {budgetProducts.map((product: Product, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        {/* Wishlist Heart Icon */}
                        <div className="absolute top-3 right-3 z-10">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`w-8 h-8 btn-icon-heart ${
                              isInWishlist(product.id) 
                                ? 'active opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToWishlist(product);
                            }}
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        <div
                          className="aspect-square overflow-hidden"
                          onClick={() =>
                            router.push(`/products/${product.id}`)
                          }
                        >
                          <ImageWithFallback
                            src={product.image}
                            alt={product.title}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/products/${product.id}`,
                              )
                            }
                          >
                            <h4 className="font-semibold text-slate-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                              {product.title}
                            </h4>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-slate-600 ml-1">
                                  {product.rating.rate}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price and Actions - Better UX Layout */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xl font-bold text-green-600">
                              £{product.price}
                            </span>
                            {getItemQuantity(product.id) > 0 ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 btn-icon-minus"
                                  onClick={() =>
                                    handleQuantityChange(
                                      product,
                                      -1,
                                    )
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-semibold text-sm">
                                  {getItemQuantity(product.id)}
                                </span>
                                <Button
                                  size="icon"
                                  className="h-7 w-7 btn-icon-plus"
                                  onClick={() =>
                                    handleQuantityChange(
                                      product,
                                      1,
                                    )
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    product,
                                    1,
                                  )
                                }
                                className="btn-icon-add-cart px-3 py-1"
                              >
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Featured Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-12"
          >
            <Card className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-800">
                      Featured Products
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View All</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
                  {featuredProducts.map((product: Product, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        {/* Wishlist Heart Icon */}
                        <div className="absolute top-3 right-3 z-10">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`w-8 h-8 btn-icon-heart ${
                              isInWishlist(product.id) 
                                ? 'active opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToWishlist(product);
                            }}
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        <div
                          className="aspect-square overflow-hidden"
                          onClick={() =>
                            router.push(`/products/${product.id}`)
                          }
                        >
                          <ImageWithFallback
                            src={product.image}
                            alt={product.title}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/products/${product.id}`,
                              )
                            }
                          >
                            <h4 className="font-semibold text-slate-800 line-clamp-2 mb-2 min-h-[2.5rem]">
                              {product.title}
                            </h4>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-slate-600 ml-1">
                                  {product.rating.rate}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price and Actions - Better UX Layout */}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xl font-bold text-green-600">
                              £{product.price}
                            </span>
                            {getItemQuantity(product.id) > 0 ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 btn-icon-minus"
                                  onClick={() =>
                                    handleQuantityChange(
                                      product,
                                      -1,
                                    )
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center font-semibold text-sm">
                                  {getItemQuantity(product.id)}
                                </span>
                                <Button
                                  size="icon"
                                  className="h-7 w-7 btn-icon-plus"
                                  onClick={() =>
                                    handleQuantityChange(
                                      product,
                                      1,
                                    )
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    product,
                                    1,
                                  )
                                }
                                className="btn-icon-add-cart px-3 py-1"
                              >
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}