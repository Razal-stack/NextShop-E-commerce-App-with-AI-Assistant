'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types';
import { toast } from 'sonner';
import { NavigationHelper } from '@/utils/navigation';
import {
  SearchAndFilters,
  ProductsGrid,
  Pagination
} from './products';

export default function ProductsPage() {
  const { products, loading: isLoading } = useProducts();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFiltersInfo, setAppliedFiltersInfo] = useState<string>('');
  
  const itemsPerPage = 9;

  // Initialize filters from URL params
  useEffect(() => {
    const { filters, showFilters: shouldShowFilters } = 
      NavigationHelper.parseFiltersFromURL(searchParams);
    
    if (filters.category) {
      setSelectedCategory(filters.category);
    }
    
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      setPriceRange([
        filters.priceMin ?? 0,
        filters.priceMax ?? 1000
      ]);
    }
    
    if (filters.sort) {
      setSortBy(filters.sort);
    }
    
    if (filters.search) {
      setSearchTerm(filters.search);
    }
    
    // Auto-expand filters if they were set from homepage
    setShowFilters(shouldShowFilters);
    
    // Build filter info message for display
    if (Object.keys(filters).length > 0) {
      const appliedFilters = [];
      
      if (filters.category) appliedFilters.push(`Category: ${filters.category}`);
      if (filters.priceMax) appliedFilters.push(`Under £${filters.priceMax}`);
      if (filters.search) appliedFilters.push(`Search: "${filters.search}"`);
      if (filters.type) appliedFilters.push(`Type: ${filters.type}`);
      
      if (appliedFilters.length > 0) {
        setAppliedFiltersInfo(`Filters applied: ${appliedFilters.join(', ')}`);
      }
    }
  }, [searchParams]);

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setPriceRange([0, 1000]);
    setSortBy('name');
    setAppliedFiltersInfo('');
    
    // Navigate to clean products page
    router.push('/products');
  };

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
          <p className="text-slate-600">
            {appliedFiltersInfo || 'Discover amazing products at great prices'}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          categories={categories}
          maxPrice={maxPrice}
          onClearFilters={handleClearFilters}
          appliedFiltersInfo={appliedFiltersInfo}
        />

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
        <ProductsGrid
          products={currentProducts}
          viewMode={viewMode}
          isLoading={isLoading}
          onClearFilters={handleClearFilters}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}