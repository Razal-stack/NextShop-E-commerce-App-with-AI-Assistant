'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function UserProfile() {
  const { user, updateUser, deleteAccount, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: user?.name?.firstname || '',
    lastname: user?.name?.lastname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.address?.city || '',
    street: user?.address?.street || '',
    number: user?.address?.number?.toString() || '',
    zipcode: user?.address?.zipcode || ''
  });

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return `${user.name.firstname?.[0] || ''}${user.name.lastname?.[0] || ''}`.toUpperCase();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const updateData = {
      name: {
        firstname: formData.firstname,
        lastname: formData.lastname
      },
      email: formData.email,
      phone: formData.phone,
      address: {
        ...user?.address,
        city: formData.city,
        street: formData.street,
        number: parseInt(formData.number) || 0,
        zipcode: formData.zipcode,
        geolocation: user?.address?.geolocation || {
          lat: '',
          long: ''
        }
      }
    };

    const success = await updateUser(updateData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstname: user?.name?.firstname || '',
      lastname: user?.name?.lastname || '',
      email: user?.email || '',
      phone: user?.phone || '',
      city: user?.address?.city || '',
      street: user?.address?.street || '',
      number: user?.address?.number?.toString() || '',
      zipcode: user?.address?.zipcode || ''
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      await deleteAccount();
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={user.username} />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {user.name?.firstname} {user.name?.lastname}
              </CardTitle>
              <CardDescription className="text-lg">@{user.username}</CardDescription>
              <Badge variant="secondary" className="mt-2">
                Member since 2024
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your personal details and contact information
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstname">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstname"
                  value={formData.firstname}
                  onChange={(e) => handleInputChange('firstname', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.name?.firstname || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name</Label>
              {isEditing ? (
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => handleInputChange('lastname', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.name?.lastname || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.email || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.phone || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            Your delivery and billing address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.address?.city || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipcode">Postal Code</Label>
              {isEditing ? (
                <Input
                  id="zipcode"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.address?.zipcode || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              {isEditing ? (
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.address?.street || 'Not provided'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">House Number</Label>
              {isEditing ? (
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                  {user.address?.number || 'Not provided'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            Delete Account
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
