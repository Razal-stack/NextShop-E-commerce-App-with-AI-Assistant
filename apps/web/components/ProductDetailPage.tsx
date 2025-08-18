'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Shield,
  Truck,
  RotateCcw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useUIStore, useCartStore, useWishlistStore } from "../lib/store";
import { Product } from "../lib/types";
import ImageWithFallback from "./handlers/ImageWithFallback";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products, setProducts } = useUIStore();
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, items: wishlist } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      // First try to find product in store
      if (products.length > 0) {
        const foundProduct = products.find((p: Product) => p.id === parseInt(id));
        if (foundProduct) {
          setProduct(foundProduct);
          return;
        }
      }

      // If not found in store or store is empty, fetch from API
      setIsLoading(true);
      try {
        // Fetch all products if store is empty
        if (products.length === 0) {
          const allProductsResponse = await fetch('https://fakestoreapi.com/products');
          if (allProductsResponse.ok) {
            const allProducts = await allProductsResponse.json();
            setProducts(allProducts);
            const foundProduct = allProducts.find((p: Product) => p.id === parseInt(id));
            setProduct(foundProduct || null);
          }
        } else {
          // Fetch specific product
          const response = await fetch(`https://fakestoreapi.com/products/${id}`);
          if (response.ok) {
            const productData = await response.json();
            setProduct(productData);
          } else {
            toast.error('Product not found');
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [id, products, setProducts]);

  if (isLoading || !product) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">
            {isLoading ? 'Loading product details...' : 'Product not found'}
          </p>
        </div>
      </div>
    );
  }

  const isInWishlist = wishlist.some(
    (item) => item.id === product.id,
  );
  const relatedProducts = products
    .filter(
      (p: Product) =>
        p.category === product.category && p.id !== product.id,
    )
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleAddToWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist!");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist!");
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/products")}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Button>
        </motion.div>

        {/* Product Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-12 mb-16"
        >
          {/* Product Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square overflow-hidden rounded-2xl bg-white shadow-lg"
            >
              <ImageWithFallback
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Thumbnail images (simulated - same image for demo) */}
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? "border-brand-500"
                      : "border-slate-200"
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <ImageWithFallback
                    src={product.image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="outline" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {product.title}
              </h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating.rate)
                          ? "text-gold-500 fill-current"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-600">
                  {product.rating.rate} ({product.rating.count}{" "}
                  reviews)
                </span>
              </div>

              <p className="text-slate-700 leading-relaxed mb-6">
                {product.description}
              </p>
            </motion.div>

            <Separator />

            {/* Price and Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-green-600">
                  £{product.price.toFixed(2)}
                </span>
                <span className="text-gray-500 line-through">
                  £{(product.price * 1.2).toFixed(2)}
                </span>
                <Badge variant="destructive">17% OFF</Badge>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setQuantity(Math.max(1, quantity - 1))
                    }
                    className="btn-secondary h-10 w-10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="btn-secondary h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="btn-primary flex-1 h-12 text-white"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart - £
                  {(product.price * quantity).toFixed(2)}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddToWishlist}
                  className={`h-12 px-6 ${isInWishlist ? "btn-destructive" : "btn-secondary"}`}
                >
                  <Heart
                    className={`w-5 h-5 mr-2 ${isInWishlist ? "fill-current" : ""}`}
                  />
                  {isInWishlist
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"}
                </Button>
              </div>
            </motion.div>

            <Separator />

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 text-slate-600">
                <Truck className="w-5 h-5" />
                <span>Free shipping on orders over £50</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <RotateCcw className="w-5 h-5" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <Shield className="w-5 h-5" />
                <span>2-year warranty included</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: Product, index: number) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group cursor-pointer"
                  onClick={() =>
                    router.push(`/products/${relatedProduct.id}`)
                  }
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-slate-200/50">
                    <CardContent className="p-0">
                      <div className="aspect-square overflow-hidden">
                        <ImageWithFallback
                          src={relatedProduct.image}
                          alt={relatedProduct.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                          {relatedProduct.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-600">
                            £{relatedProduct.price.toFixed(2)}
                          </span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-gold-500 fill-current" />
                            <span className="text-sm text-slate-600 ml-1">
                              {relatedProduct.rating.rate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}