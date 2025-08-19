'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, UserPlus, ArrowRight, ArrowLeft, 
  Check, User, MapPin 
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import { Progress } from '../../ui/progress';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstname: string;
  lastname: string;
  phone: string;
  city: string;
  street: string;
  number: string;
  zipcode: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const STEPS = {
  ACCOUNT: 1,
  PERSONAL: 2
} as const;

type StepType = typeof STEPS[keyof typeof STEPS];

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState<StepType>(STEPS.ACCOUNT);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    phone: '',
    city: '',
    street: '',
    number: '',
    zipcode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'First name is required';
    }
    
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Last name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street is required';
    }
    
    if (!formData.number.trim()) {
      newErrors.number = 'Street number is required';
    }
    
    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'Zip code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(STEPS.PERSONAL);
    }
  };

  const handleBack = () => {
    setCurrentStep(STEPS.ACCOUNT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    const registerData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      name: {
        firstname: formData.firstname,
        lastname: formData.lastname
      },
      address: {
        city: formData.city,
        street: formData.street,
        number: parseInt(formData.number) || 0,
        zipcode: formData.zipcode,
        geolocation: {
          lat: '-37.3159',
          long: '81.1496'
        }
      },
      phone: formData.phone
    };
    
    const success = await register(registerData);
    if (success) {
      router.push('/auth/signin');
    }
  };

  const progressPercentage = currentStep === STEPS.ACCOUNT ? 50 : 100;

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <Card className="border-0 shadow-2xl bg-white backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 flex items-center justify-center shadow-lg"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Join NextShop</h1>
            <p className="text-slate-600">Create your account to start shopping</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Step {currentStep} of 2</span>
              <span className="text-brand-600 font-medium">
                {currentStep === STEPS.ACCOUNT ? 'Account Setup' : 'Personal Info'}
              </span>
            </div>
            {/* Custom Progress Bar */}
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-600 to-brand-700 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <form onSubmit={currentStep === STEPS.ACCOUNT ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Account Details */}
              {currentStep === STEPS.ACCOUNT && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-brand-600" />
                    <h3 className="font-semibold text-slate-800">Account Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose your username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.username ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.username && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.username}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.email ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create secure password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`h-12 pr-10 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.password ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`h-12 pr-10 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="btn-primary w-full h-12 font-medium mt-6 shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    Continue to Personal Info
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === STEPS.PERSONAL && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    <h3 className="font-semibold text-slate-800">Personal & Address Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname">First Name</Label>
                      <Input
                        id="firstname"
                        type="text"
                        placeholder="First name"
                        value={formData.firstname}
                        onChange={(e) => handleInputChange('firstname', e.target.value)}
                        className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.firstname ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      {errors.firstname && (
                        <p className="text-sm text-red-500">{errors.firstname}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastname">Last Name</Label>
                      <Input
                        id="lastname"
                        type="text"
                        placeholder="Last name"
                        value={formData.lastname}
                        onChange={(e) => handleInputChange('lastname', e.target.value)}
                        className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.lastname ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      {errors.lastname && (
                        <p className="text-sm text-red-500">{errors.lastname}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.phone ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Your city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.city ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Name</Label>
                      <Input
                        id="street"
                        type="text"
                        placeholder="Street name"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.street ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      {errors.street && (
                        <p className="text-sm text-red-500">{errors.street}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number">House Number</Label>
                      <Input
                        id="number"
                        type="text"
                        placeholder="House/Apt #"
                        value={formData.number}
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.number ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      {errors.number && (
                        <p className="text-sm text-red-500">{errors.number}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipcode">Postal Code</Label>
                    <Input
                      id="zipcode"
                      type="text"
                      placeholder="Your postal code"
                      value={formData.zipcode}
                      onChange={(e) => handleInputChange('zipcode', e.target.value)}
                      className={`h-12 bg-white border-slate-200 focus:border-slate-300 focus:ring-slate-200 placeholder:text-slate-400 ${errors.zipcode ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {errors.zipcode && (
                      <p className="text-sm text-red-500">{errors.zipcode}</p>
                    )}
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="btn-secondary flex-1 h-12 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex-1 h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Create Account
                          <Check className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Sign In Link */}
          <div className="mt-8">
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-sm text-slate-500">or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
