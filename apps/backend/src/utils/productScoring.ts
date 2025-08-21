/**
 * Product Scoring Algorithm for Dynamic Ranking
 * This module provides scoring mechanisms for products based on various criteria
 */

import { Product } from '../types/index';

export interface ScoringWeights {
  price: number;
  rating: number;
  reviewCount: number;
  popularity: number;
  availability: number;
  relevance: number;
}

export interface ScoringCriteria {
  weights: ScoringWeights;
  pricePreference: 'low' | 'high' | 'balanced';
  prioritizeRating: boolean;
  prioritizePopularity: boolean;
}

export class ProductScoringEngine {
  private static readonly DEFAULT_WEIGHTS: ScoringWeights = {
    price: 0.2,
    rating: 0.3,
    reviewCount: 0.2,
    popularity: 0.15,
    availability: 0.1,
    relevance: 0.05
  };

  /**
   * Calculate a comprehensive score for a product
   */
  static calculateScore(
    product: Product,
    criteria: Partial<ScoringCriteria> = {},
    context: {
      averagePrice?: number;
      maxPrice?: number;
      minPrice?: number;
      searchQuery?: string;
      userBudget?: number;
    } = {}
  ): number {
    const weights = { ...this.DEFAULT_WEIGHTS, ...criteria.weights };
    let totalScore = 0;

    // Price Score (0-1, higher is better based on preference)
    const priceScore = this.calculatePriceScore(
      product.price, 
      context, 
      criteria.pricePreference || 'balanced'
    );
    totalScore += priceScore * weights.price;

    // Rating Score (0-1, higher is better)
    const ratingScore = this.calculateRatingScore(product.rating);
    totalScore += ratingScore * weights.rating;

    // Review Count Score (0-1, higher is better)
    const reviewCountScore = this.calculateReviewCountScore(product.rating.count);
    totalScore += reviewCountScore * weights.reviewCount;

    // Popularity Score (based on rating count and rate combined)
    const popularityScore = this.calculatePopularityScore(product.rating);
    totalScore += popularityScore * weights.popularity;

    // Availability Score (assuming all products are available for now)
    const availabilityScore = 1.0;
    totalScore += availabilityScore * weights.availability;

    // Relevance Score (based on search query match)
    const relevanceScore = this.calculateRelevanceScore(product, context.searchQuery);
    totalScore += relevanceScore * weights.relevance;

    return Math.min(Math.max(totalScore, 0), 1);
  }

  /**
   * Score products and return them sorted by score
   */
  static scoreAndSortProducts(
    products: Product[],
    criteria: Partial<ScoringCriteria> = {},
    context: {
      searchQuery?: string;
      userBudget?: number;
      category?: string;
    } = {}
  ): Array<Product & { score: number }> {
    // Calculate price context
    const prices = products.map(p => p.price);
    const priceContext = {
      averagePrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices),
      ...context
    };

    // Calculate scores for all products
    const scoredProducts = products.map(product => ({
      ...product,
      score: this.calculateScore(product, criteria, priceContext)
    }));

    // Sort by score (highest first)
    return scoredProducts.sort((a, b) => b.score - a.score);
  }

  /**
   * Get recommended products based on user preferences
   */
  static getRecommendedProducts(
    allProducts: Product[],
    userPreferences: {
      budget?: number;
      categories?: string[];
      minRating?: number;
      pricePreference?: 'low' | 'high' | 'balanced';
    } = {},
    limit: number = 10
  ): Product[] {
    let filteredProducts = allProducts;

    // Filter by budget
    if (userPreferences.budget) {
      filteredProducts = filteredProducts.filter(p => p.price <= userPreferences.budget!);
    }

    // Filter by categories
    if (userPreferences.categories && userPreferences.categories.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        userPreferences.categories!.includes(p.category)
      );
    }

    // Filter by minimum rating
    if (userPreferences.minRating) {
      filteredProducts = filteredProducts.filter(p => 
        p.rating.rate >= userPreferences.minRating!
      );
    }

    // Score and sort
    const scoringCriteria: Partial<ScoringCriteria> = {
      pricePreference: userPreferences.pricePreference || 'balanced'
    };

    const scoredProducts = this.scoreAndSortProducts(
      filteredProducts, 
      scoringCriteria,
      { userBudget: userPreferences.budget }
    );

    return scoredProducts.slice(0, limit);
  }

  private static calculatePriceScore(
    price: number, 
    context: { averagePrice?: number; maxPrice?: number; minPrice?: number; userBudget?: number }, 
    preference: 'low' | 'high' | 'balanced'
  ): number {
    const { averagePrice, maxPrice, minPrice, userBudget } = context;

    // If user has a budget, prioritize products within budget
    if (userBudget && price > userBudget) {
      return 0.1; // Low score for over-budget items
    }

    if (!maxPrice || !minPrice || maxPrice === minPrice) {
      return 0.5; // Default score if no price context
    }

    const normalizedPrice = (price - minPrice) / (maxPrice - minPrice);

    switch (preference) {
      case 'low':
        return 1 - normalizedPrice; // Lower price = higher score
      case 'high':
        return normalizedPrice; // Higher price = higher score
      case 'balanced':
      default:
        // Prefer prices close to average
        if (averagePrice) {
          const deviation = Math.abs(price - averagePrice) / (maxPrice - minPrice);
          return 1 - deviation;
        }
        return 0.5;
    }
  }

  private static calculateRatingScore(rating: { rate: number; count: number }): number {
    // Convert 5-star rating to 0-1 score
    return rating.rate / 5.0;
  }

  private static calculateReviewCountScore(count: number): number {
    // Use logarithmic scale for review count (more reviews = higher score, but with diminishing returns)
    if (count <= 0) return 0;
    if (count >= 1000) return 1;
    
    // Normalize using log scale
    return Math.log(count + 1) / Math.log(1001);
  }

  private static calculatePopularityScore(rating: { rate: number; count: number }): number {
    // Combine rating and count for popularity
    // Use Wilson confidence interval concept
    const rate = rating.rate;
    const count = rating.count;
    
    if (count === 0) return 0;
    
    // Weight high ratings with good review counts
    const confidence = count / (count + 10); // Confidence increases with more reviews
    const adjustedRating = (rate * confidence) + (2.5 * (1 - confidence)); // Default to neutral for low counts
    
    return adjustedRating / 5.0;
  }

  private static calculateRelevanceScore(product: Product, searchQuery?: string): number {
    if (!searchQuery || searchQuery.trim() === '') {
      return 0.5; // Default relevance when no search query
    }

    const query = searchQuery.toLowerCase();
    const title = product.title.toLowerCase();
    const description = product.description.toLowerCase();
    const category = product.category.toLowerCase();

    let score = 0;

    // Exact matches in title (highest weight)
    if (title.includes(query)) {
      score += 0.6;
    }

    // Exact matches in category
    if (category.includes(query)) {
      score += 0.3;
    }

    // Exact matches in description
    if (description.includes(query)) {
      score += 0.2;
    }

    // Word matches (partial credit)
    const queryWords = query.split(' ').filter(word => word.length > 2);
    for (const word of queryWords) {
      if (title.includes(word)) score += 0.1;
      if (category.includes(word)) score += 0.05;
      if (description.includes(word)) score += 0.03;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Create scoring criteria based on user intent and context
   */
  static createScoringCriteria(intent: string, context: any): Partial<ScoringCriteria> {
    const criteria: Partial<ScoringCriteria> = {};

    switch (intent) {
      case 'budget_shopping':
        criteria.pricePreference = 'low';
        criteria.weights = {
          ...this.DEFAULT_WEIGHTS,
          price: 0.4,
          rating: 0.2,
          reviewCount: 0.2,
          popularity: 0.15,
          availability: 0.05,
          relevance: 0.0
        };
        break;

      case 'premium_shopping':
        criteria.pricePreference = 'high';
        criteria.weights = {
          ...this.DEFAULT_WEIGHTS,
          price: 0.15,
          rating: 0.4,
          reviewCount: 0.25,
          popularity: 0.15,
          availability: 0.05,
          relevance: 0.0
        };
        break;

      case 'popular_items':
        criteria.prioritizePopularity = true;
        criteria.weights = {
          ...this.DEFAULT_WEIGHTS,
          price: 0.1,
          rating: 0.25,
          reviewCount: 0.25,
          popularity: 0.35,
          availability: 0.05,
          relevance: 0.0
        };
        break;

      case 'search_results':
        criteria.weights = {
          ...this.DEFAULT_WEIGHTS,
          price: 0.15,
          rating: 0.25,
          reviewCount: 0.15,
          popularity: 0.15,
          availability: 0.05,
          relevance: 0.25
        };
        break;

      default:
        // Balanced scoring for general browsing
        criteria.pricePreference = 'balanced';
        criteria.weights = this.DEFAULT_WEIGHTS;
    }

    return criteria;
  }
}

export default ProductScoringEngine;
