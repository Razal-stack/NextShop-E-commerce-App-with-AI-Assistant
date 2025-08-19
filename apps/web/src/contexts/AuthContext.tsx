'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserService } from '../services';
import type { User } from '../types';

interface AuthUser extends User {
  // Add any additional auth-specific fields if needed
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: {
    firstname: string;
    lastname: string;
  };
  address: {
    city: string;
    street: string;
    number: number;
    zipcode: string;
    geolocation: {
      lat: string;
      long: string;
    };
  };
  phone: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  deleteAccount: () => Promise<boolean>;
  updateUser: (userData: Partial<AuthUser>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('nextshop_token');
        const storedUser = localStorage.getItem('nextshop_user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('nextshop_token');
        localStorage.removeItem('nextshop_user');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    if (isLoading) return false;
    
    setIsLoading(true);
    try {
      const result = await UserService.login(credentials);
      
      if (!result.token) {
        toast.error('Invalid response from server');
        return false;
      }

      // For demo purposes, create a mock user based on username
      // In production, you'd get this from your backend
      const mockUser: AuthUser = {
        id: 1,
        username: credentials.username,
        email: credentials.username === 'johnd' ? 'john@gmail.com' : `${credentials.username}@example.com`,
        password: '', // Never store passwords in frontend
        name: {
          firstname: credentials.username === 'johnd' ? 'John' : 'Demo',
          lastname: credentials.username === 'johnd' ? 'Doe' : 'User'
        },
        address: {
          city: 'Los Angeles',
          street: 'Main Street',
          number: 123,
          zipcode: '90210',
          geolocation: {
            lat: '34.0522',
            long: '-118.2437'
          }
        },
        phone: '1-570-236-7033'
      };

      setToken(result.token);
      setUser(mockUser);
      
      // Persist to localStorage
      localStorage.setItem('nextshop_token', result.token);
      localStorage.setItem('nextshop_user', JSON.stringify(mockUser));
      
      toast.success(`Welcome back, ${mockUser.name.firstname}!`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    if (isLoading) return false;
    
    setIsLoading(true);
    try {
      const newUser = await UserService.createUser(userData);
      
      if (!newUser) {
        toast.error('Registration failed');
        return false;
      }

      // Auto-login after successful registration
      const loginSuccess = await login({
        username: userData.username,
        password: userData.password
      });
      
      if (loginSuccess) {
        toast.success('Account created successfully! Welcome to NextShop!');
        return true;
      }
      
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nextshop_token');
    localStorage.removeItem('nextshop_user');
    toast.success('Logged out successfully');
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!user || isLoading) return false;
    
    setIsLoading(true);
    try {
      await UserService.deleteUser(user.id);
      logout();
      toast.success('Account deleted successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<AuthUser>): Promise<boolean> => {
    if (!user || isLoading) return false;
    
    setIsLoading(true);
    try {
      const updatedUser = await UserService.updateUser(user.id, userData);
      
      if (updatedUser) {
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        localStorage.setItem('nextshop_user', JSON.stringify(newUser));
        toast.success('Profile updated successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = Boolean(user && token);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    deleteAccount,
    updateUser,
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
