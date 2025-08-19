'use client';

import React from "react";
import HeroSection from "./homepage/HeroSection";
import CategoriesWidget from "./homepage/CategoriesWidget";
import TopRatedWidget from "./homepage/TopRatedWidget";
import BudgetPicksWidget from "./homepage/BudgetPicksWidget";
import FeaturedProductsWidget from "./homepage/FeaturedProductsWidget";

export default function HomePage() {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30">
      {/* Hero Section - Nex Shopping Assistant */}
      <HeroSection />

      {/* Widgets Section */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories and Top Rated Row */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <CategoriesWidget />
            <TopRatedWidget />
          </div>

          {/* Budget Picks Section */}
          <BudgetPicksWidget />

          {/* Featured Products */}
          <FeaturedProductsWidget />
        </div>
      </section>
    </div>
  );
}