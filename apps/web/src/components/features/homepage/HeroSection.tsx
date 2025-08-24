'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  Mic,
  Camera,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { NavigationHelper } from "@/utils/navigation";

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
    icon: <MessageCircle className="h-5 w-5" />,
    image:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop",
  },
  {
    title: "Voice Search",
    description: "Use voice commands to find products",
    icon: <Mic className="w-5 h-5" />,
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

export default function HeroSection() {
  const router = useRouter();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputText, setInputText] = useState("");

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

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Navigate to products page with search filter applied
    NavigationHelper.navigateToProductsWithFilters(router, {
      filters: { search: inputText.trim() },
      showFilters: true
    });
    
    setInputText("");
  };

  return (
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
  );
}
