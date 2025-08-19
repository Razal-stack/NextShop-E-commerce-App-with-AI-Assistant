'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore, useWishlistStore } from "@/lib/store";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import { toast } from "sonner";
import { NavigationHelper } from "@/utils/navigation";
import AuthModal from "@/components/shared/AuthModal";
import {
  ProductImageGallery,
  ProductInfo,
  ProductPricing,
  ProductActions,
  ProductFeatures,
  RelatedProducts
} from './product-detail';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products } = useProducts();
  const { addItem: addToCart } = useCart(); // Use unified cart hook for backend sync
  const { items: cart } = useCartStore(); // Keep for local cart display
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlist } = useWishlistStore();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'cart' | 'wishlist'>('cart');
  const [backNavigation, setBackNavigation] = useState({
    path: '/products',
    label: 'Back to Products',
    useHistory: false
  });

  useEffect(() => {
    if (!id) return;

    const foundProduct = products.find((p: Product) => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      setProduct(null);
    }
  }, [id, products]);

  // Set up back navigation context
  useEffect(() => {
    const navigation = NavigationHelper.getBackNavigation();
    setBackNavigation(navigation);
  }, []);

  const handleBackNavigation = () => {
    if (backNavigation.useHistory) {
      // Use browser back if available and appropriate
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/products');
      }
    } else {
      router.push(backNavigation.path);
    }
  };

  if (!product) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">
            {products.length === 0 ? 'Loading product details...' : 'Product not found'}
          </p>
        </div>
      </div>
    );
  }

  const isInWishlist = isAuthenticated && wishlist.some((item) => item.id === product.id);
  const relatedProducts = products
    .filter((p: Product) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setAuthAction('cart');
      setShowAuthModal(true);
      return;
    }
    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart(product);
      }
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      setAuthAction('wishlist');
      setShowAuthModal(true);
      return;
    }
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist!");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist!");
    }
  };

  return (
    <>
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
        productTitle={product?.title}
      />
      
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={handleBackNavigation}
            className="flex items-center gap-2 hover:bg-slate-50 border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {backNavigation.label}
          </Button>
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-12 mb-16"
        >
          {/* Product Images */}
          <ProductImageGallery product={product} />

          {/* Product Info */}
          <div className="space-y-6">
            <ProductInfo product={product} />

            <Separator />

            {/* Price and Actions */}
            <ProductPricing 
              product={product} 
              quantity={quantity} 
              setQuantity={setQuantity} 
            />

            {/* Action Buttons */}
            <ProductActions
              product={product}
              quantity={quantity}
              isInWishlist={isInWishlist}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
            />

            <Separator />

            {/* Features */}
            <ProductFeatures />
          </div>
        </motion.div>

        {/* Related Products */}
        <RelatedProducts relatedProducts={relatedProducts} />
      </div>
    </div>
    </>
  );
}