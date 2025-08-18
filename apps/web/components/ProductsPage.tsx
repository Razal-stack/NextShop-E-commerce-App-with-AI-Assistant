'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3X3, List, Star, Heart, ShoppingCart, SlidersHorizontal, Sparkles, Plus, Minus, Mic, Image, Calculator, BarChart3, TrendingUp, ChevronRight, User, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useUIStore, useCartStore, useWishlistStore } from '../lib/store';
import { Product } from '../lib/types';
import { useRouter } from 'next/navigation';
import ImageWithFallback from './handlers/ImageWithFallback';
import { toast } from 'sonner';

// Enhanced Draggable Nex Assistant Component
const DraggableNexAssistant = () => {
  const [position, setPosition] = useState({ x: 20, y: 200 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isOnLeft, setIsOnLeft] = useState(false); // Default to right side
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  // Safe boundary constants
  const HEADER_HEIGHT = 80; // Approximate header height
  const EDGE_PADDING = 20; // Distance from screen edges
  const ICON_SIZE = 64;
  const DRAG_THRESHOLD = 3; // Minimum distance to consider as drag (reduced)

  // Initialize position properly at bottom-right
  useEffect(() => {
    const initPosition = () => {
      if (typeof window === 'undefined') return;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Start at bottom-right with safe boundaries
      const startX = windowWidth - ICON_SIZE - EDGE_PADDING;
      const startY = windowHeight - ICON_SIZE - EDGE_PADDING;
      
      setPosition({ x: startX, y: startY });
      setIsOnLeft(false); // Starting on right side
    };

    const timer = setTimeout(initPosition, 100);
    window.addEventListener('resize', initPosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initPosition);
    };
  }, []);

  const handleDragStart = () => {
    setIsDragging(true);
    setHasDragged(false);
  };

  const handleDrag = (event: any, info: any) => {
    // Detect if user has actually dragged beyond threshold
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    if (dragDistance > DRAG_THRESHOLD) {
      setHasDragged(true);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    
    // If dragged, update position to where it was dropped BUT enforce strict boundaries
    if (hasDragged && !isExpanded) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate the desired final position
      const desiredX = position.x + info.offset.x;
      const desiredY = position.y + info.offset.y;
      
      // Apply STRICT boundary constraints
      const minY = HEADER_HEIGHT + EDGE_PADDING; // Below header with padding
      const maxY = windowHeight - ICON_SIZE - EDGE_PADDING; // Above bottom edge
      const minX = EDGE_PADDING; // Away from left edge
      const maxX = windowWidth - ICON_SIZE - EDGE_PADDING; // Away from right edge
      
      // Constrain the position within strict boundaries
      const finalX = Math.max(minX, Math.min(maxX, desiredX));
      const finalY = Math.max(minY, Math.min(maxY, desiredY));
      
      // Update to the constrained position
      setPosition({ x: finalX, y: finalY });
      
      // Determine which side for expanded chat positioning
      const centerX = windowWidth / 2;
      const iconCenterX = finalX + (ICON_SIZE / 2);
      setIsOnLeft(iconCenterX < centerX);
      
      console.log('Icon dropped and constrained:', { 
        desired: { x: desiredX, y: desiredY },
        final: { x: finalX, y: finalY },
        boundaries: { minX, maxX, minY, maxY },
        side: iconCenterX < centerX ? 'left' : 'right' 
      });
    }
    
    // Reset drag state after a brief delay to prevent click interference
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    toast.success("Nex is analyzing your request...");
    setInputText('');
  };

  const handleToggleExpanded = () => {
    // Only toggle if we haven't just finished dragging
    if (!hasDragged && !isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  // Fixed positions for expanded chat interface - always consistent positioning
  const getExpandedPosition = () => {
    if (isOnLeft) {
      return "fixed left-6 top-24 bottom-6 w-96 z-50"; // Left side
    } else {
      return "fixed right-6 top-24 bottom-6 w-96 z-50"; // Right side
    }
  };

  // Don't render the draggable icon when expanded
  if (!isExpanded) {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    return (
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        // Allow free dragging within screen bounds
        dragConstraints={{
          left: EDGE_PADDING,
          right: windowWidth - ICON_SIZE - EDGE_PADDING,
          top: HEADER_HEIGHT + EDGE_PADDING,
          bottom: windowHeight - ICON_SIZE - EDGE_PADDING
        }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ 
          x: position.x, 
          y: position.y
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          mass: 0.8
        }}
        style={{ 
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 9999
        }}
        className="cursor-move"
        whileHover={{ scale: isDragging ? 1 : 1.05 }}
        whileTap={{ scale: isDragging ? 1 : 0.95 }}
        whileDrag={{ 
          scale: 1.1,
          rotate: [0, -2, 2, 0],
          transition: { rotate: { duration: 0.2 } }
        }}
      >
        <motion.div
          className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center cursor-pointer relative overflow-hidden brand-glow ${
            isDragging ? 'shadow-2xl' : ''
          }`}
          style={{ 
            background: isDragging 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'var(--brand-gradient)' 
          }}
          onClick={handleToggleExpanded}
          whileHover={{ 
            boxShadow: isDragging 
              ? "0 0 40px rgba(102, 126, 234, 0.8)" 
              : "0 0 30px rgba(4, 57, 215, 0.5)",
          }}
        >
          <motion.div
            animate={isDragging ? {
              rotate: [0, 180, 360],
              scale: [1, 1.3, 1]
            } : { 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={isDragging ? {
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
            } : { 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className={`${isDragging ? 'w-10 h-10' : 'w-8 h-8'} text-white transition-all duration-200`} />
          </motion.div>
          <div className="absolute inset-0 ai-shimmer"></div>
          
          {/* Pulsing notification */}
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center pulse-brand"
          >
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </motion.div>
          
          {/* Drag hint when hovering and not dragging */}
          {!isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-600 whitespace-nowrap pointer-events-none"
            >
              Drag to move • Click to chat
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Expanded chat interface with fixed positioning and smooth animations
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.8,
        x: isOnLeft ? -50 : 50,
        y: -20
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: 0,
        y: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        x: isOnLeft ? -50 : 50,
        y: -20
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
      className={getExpandedPosition()}
    >
      <Card className="h-full flex flex-col shadow-2xl border-0 overflow-hidden bg-white backdrop-blur-sm">
        {/* Modern Header with improved visual hierarchy */}
        <div className="relative flex items-center justify-between p-4 text-white" style={{ background: 'var(--brand-gradient)' }}>
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)'
          }}></div>
          
          <div className="relative flex items-center space-x-3">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">Nex Assistant</h3>
              <p className="text-xs text-white/90 font-medium">AI Shopping Expert</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            className="relative h-10 w-10 text-white hover:bg-white/15 rounded-xl transition-all duration-200"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              ×
            </motion.div>
          </Button>
        </div>

        {/* Chat Content Area with cleaner, more spacious design */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            {/* Clean Welcome Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Welcome to Nex Assistant</h4>
              <p className="text-slate-600 leading-relaxed">
                I'll help you build the perfect cart within your budget and specifications.
              </p>
            </div>

            {/* Key Features with clean spacing - reduced to 3 items */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-3"></span>
                What I can help you with
              </h5>
              <div className="space-y-3">
                {[
                  { 
                    text: "Build cart within your budget", 
                    icon: Calculator, 
                    desc: "Set your budget and I'll find the best products" 
                  },
                  { 
                    text: "Find products by specifications", 
                    icon: SlidersHorizontal, 
                    desc: "Tell me your requirements and I'll match them" 
                  },
                  { 
                    text: "Compare similar products", 
                    icon: BarChart3, 
                    desc: "Side-by-side comparison of features and prices" 
                  }
                ].map((feature, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInputText(feature.text)}
                    className="flex items-start p-3 text-left bg-white hover:bg-slate-50 rounded-lg border border-slate-200 hover:border-brand-200 transition-all duration-200 w-full group"
                  >
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-brand-100 transition-colors duration-200">
                      <feature.icon className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 mb-1">
                        {feature.text}
                      </div>
                      <div className="text-xs text-slate-500">
                        {feature.desc}
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-brand-500 transition-colors duration-200 mt-1" />
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Sample conversation - simplified and smaller */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-slate-700 flex items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3"></span>
                Recent Help
              </h5>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-2.5 h-2.5 text-slate-600" />
                  </div>
                  <span className="text-xs text-slate-700">"Gaming setup under £500"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-xs text-slate-600">Found 3 complete setups within budget</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Enhanced Input Area - Fixed at bottom with guaranteed visibility */}
          <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200">
            <div className="space-y-3">
              {/* Large textarea for better typing experience */}
              <div className="relative">
                <textarea
                  placeholder="Say: &quot;Laptop under £800 for design&quot; or &quot;Build office setup for £1200&quot;"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="w-full h-16 p-3 bg-slate-50 border border-slate-200 hover:border-brand-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-200/50 rounded-lg resize-none text-sm leading-relaxed transition-all duration-200 placeholder:text-slate-400 scrollbar-none overflow-hidden"
                  rows={2}
                />
                {inputText && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                  </motion.div>
                )}
              </div>
              
              {/* Action row with clean spacing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all duration-200"
                  >
                    <Mic className="w-3 h-3 mr-1" />
                    Record
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all duration-200"
                  >
                    <Image className="w-3 h-3 mr-1" />
                    Image Search
                  </Button>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="h-8 px-4 text-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: inputText.trim() ? 'var(--brand-gradient)' : '#e2e8f0' }}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default function ProductsPage() {
  const { products, setProducts } = useUIStore();
  const { addItem: addToCart, updateQuantity, items: cart } = useCartStore();
  const { addItem: addToWishlist, items: wishlist } = useWishlistStore();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products on mount if store is empty
  useEffect(() => {
    const fetchProducts = async () => {
      if (products.length === 0) {
        setIsLoading(true);
        try {
          const response = await fetch('https://fakestoreapi.com/products');
          if (response.ok) {
            const data = await response.json();
            setProducts(data);
          } else {
            toast.error('Failed to load products');
          }
        } catch (error) {
          console.error('Error fetching products:', error);
          toast.error('Failed to load products');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();
  }, [products.length, setProducts]);
  
  const itemsPerPage = 9;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p: Product) => p.category))] as string[];
    return cats;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product: Product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    filtered.sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating.rate - a.rating.rate;
        case 'name':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const maxPrice = useMemo(() => {
    return Math.max(...products.map((p: Product) => p.price), 100);
  }, [products]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  const handleAddToWishlist = (product: Product) => {
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

  const handleQuantityChange = (product: Product, change: number) => {
    const currentQuantity = getItemQuantity(product.id);
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      return;
    }
    
    if (currentQuantity === 0 && change > 0) {
      addToCart(product);
    } else {
      updateQuantity(product.id, newQuantity);
    }
  };

  const renderProductCard = (product: Product) => (
    <motion.div
      key={product.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/50 ${
        viewMode === 'list' ? 'flex' : 'flex flex-col h-full'
      }`}
    >
      <div 
        className={`cursor-pointer ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'}`}
        onClick={() => router.push(`/products/${product.id}`)}
      >
        <div className={`relative overflow-hidden ${viewMode === 'list' ? 'h-48' : 'aspect-square'}`}>
          <ImageWithFallback
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Button
              size="icon"
              variant="secondary"
              className={`w-8 h-8 rounded-full transition-opacity bg-white/90 hover:bg-white ${
                isInWishlist(product.id) 
                  ? 'opacity-100 text-red-500' 
                  : 'opacity-0 group-hover:opacity-100 text-slate-600'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToWishlist(product);
              }}
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col'}`}>
        <div 
          className={`cursor-pointer ${viewMode === 'grid' ? 'flex-1' : ''}`}
          onClick={() => router.push(`/products/${product.id}`)}
        >
          <h3 className={`font-semibold text-slate-900 line-clamp-2 mb-2 ${viewMode === 'grid' ? 'min-h-[2.5rem]' : ''}`}>
            {product.title}
          </h3>
          {viewMode === 'list' && (
            <p className="text-slate-600 text-sm line-clamp-3 mb-3">{product.description}</p>
          )}
          
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-gold-500 fill-current" />
              <span className="text-sm text-slate-600 ml-1">{product.rating.rate}</span>
              <span className="text-xs text-slate-400 ml-1">({product.rating.count})</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          </div>
        </div>
        
        {/* Price and Add to Cart in same line */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-green-600">£{product.price.toFixed(2)}</span>
          
          {getItemQuantity(product.id) > 0 ? (
            <div className="flex items-center space-x-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 btn-icon-minus"
                onClick={() => handleQuantityChange(product, -1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-semibold">{getItemQuantity(product.id)}</span>
              <Button
                size="icon"
                className="h-8 w-8 btn-icon-plus"
                onClick={() => handleQuantityChange(product, 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(product, 1);
              }}
              className="btn-icon-add-cart px-3 py-1"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Products</h1>
          <p className="text-slate-600">Discover amazing products at great prices</p>
        </motion.div>

        {/* Search and Filters */}
        <Card className="mb-8 border border-slate-200/50 shadow-lg bg-white/90 backdrop-blur-md">
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-200 h-10 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 h-10 px-4 border-slate-200 hover:border-slate-300 hover:bg-slate-50 btn-icon-hover"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
                
                <div className="flex border border-slate-200 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-r-none h-10 btn-icon-hover ${viewMode === 'grid' ? 'text-white' : ''}`}
                    style={viewMode === 'grid' ? { background: 'var(--brand-gradient)' } : {}}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-l-none h-10 btn-icon-hover ${viewMode === 'list' ? 'text-white' : ''}`}
                    style={viewMode === 'list' ? { background: 'var(--brand-gradient)' } : {}}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-200 pt-6 mt-4"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium mb-3 text-slate-700">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-10 bg-white border-slate-200 hover:border-slate-300 focus:border-slate-300 focus:ring-slate-200">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 shadow-lg">
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium mb-3 text-slate-700 ml-3">
                        Price Range: £{priceRange[0]} - £{priceRange[1]}
                      </label>
                      <div className="px-3 mt-4">
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={maxPrice}
                          step={10}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-sm font-medium mb-3 text-slate-700">Sort By</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-10 bg-white border-slate-200 hover:border-slate-300 focus:border-slate-300 focus:ring-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 shadow-lg">
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-600">
            {filteredProducts.length} products found
          </p>
          <div className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading products...</h3>
            <p className="text-slate-600">Please wait while we fetch the latest products for you.</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div
            layout
            className={`grid gap-6 mb-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            <AnimatePresence mode="wait">
              {currentProducts.map(renderProductCard)}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search criteria or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange([0, 1000]);
                setSortBy('name');
              }}
              className="border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${
                currentPage === 1 
                  ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 hover:border-slate-200 hover:bg-transparent' 
                  : ''
              }`}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`${
                    currentPage === pageNum 
                      ? 'text-white' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={currentPage === pageNum ? { background: 'var(--brand-gradient)' } : {}}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${
                currentPage === totalPages 
                  ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 hover:border-slate-200 hover:bg-transparent' 
                  : ''
              }`}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Draggable Nex Assistant */}
      <DraggableNexAssistant />
    </div>
  );
}