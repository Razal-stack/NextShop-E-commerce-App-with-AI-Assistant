'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, Star, Users, Award, Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  features?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }>;
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  features = [
    {
      icon: Sparkles,
      title: 'Smart Shopping',
      description: 'AI-powered product recommendations tailored just for you'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Express shipping and instant notifications'
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Curated selection of top-rated products'
    },
    {
      icon: Users,
      title: 'Trusted Community',
      description: 'Join thousands of satisfied customers'
    }
  ]
}: AuthLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-brand-50/30 to-brand-100/30">
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800"></div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          <div className="relative z-10 flex flex-col justify-center px-24 py-12 text-white">
            {/* Logo/Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-12 max-w-lg"
            >
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold">NextShop</h2>
              </div>
              
              <h1 className="text-4xl font-bold mb-6 leading-tight">
                {title}
              </h1>
              <p className="text-xl text-brand-100 leading-relaxed">
                {subtitle}
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-6 mb-12 max-w-md"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-4 group"
                >
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-brand-100 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 max-w-sm"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      className="w-6 h-6 bg-gradient-to-r from-brand-400 to-brand-500 rounded-full border border-white"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white font-medium text-sm">Join 50,000+ happy customers</p>
              <p className="text-brand-100 text-xs">Average rating: 4.9/5</p>
            </motion.div>
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-8 right-8 bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20"
          >
            <div className="flex items-center space-x-2 text-white text-sm">
              <Award className="w-4 h-4" />
              <span className="font-medium">Premium Quality</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-8 right-8 bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20"
          >
            <div className="flex items-center space-x-2 text-white text-sm">
              <Zap className="w-4 h-4" />
              <span className="font-medium">Fast Delivery</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Form Section */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
