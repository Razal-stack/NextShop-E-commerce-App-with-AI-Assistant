/**
 * Zod schemas for request validation
 */

import { z } from 'zod';

// Product schemas
export const ProductQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sort: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional()
});

export const ProductIdSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid product ID');
    }
    return num;
  })
});

export const CategoryParamSchema = z.object({
  category: z.string().min(1, 'Category is required')
});

// Cart schemas
export const UserIdSchema = z.object({
  userId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid user ID');
    }
    return num;
  })
});

export const AddToCartSchema = z.object({
  productId: z.number().positive('Product ID must be positive'),
  quantity: z.number().positive('Quantity must be positive').default(1)
});

export const UpdateCartItemSchema = z.object({
  productId: z.number().positive('Product ID must be positive'),
  quantity: z.number().min(0, 'Quantity must be non-negative')
});

export const CartParamsSchema = z.object({
  userId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid user ID');
    }
    return num;
  }),
  productId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid product ID');
    }
    return num;
  }).optional()
});

// FakeStore-compliant cart schemas
export const CartIdSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid cart ID');
    }
    return num;
  })
});

export const CartQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sort: z.enum(['asc', 'desc']).optional(),
  startdate: z.string().optional(),
  enddate: z.string().optional()
});

export const CreateCartSchema = z.object({
  userId: z.number().positive('User ID must be positive'),
  date: z.string().optional().default(() => new Date().toISOString()),
  products: z.array(z.object({
    productId: z.number().positive('Product ID must be positive'),
    quantity: z.number().positive('Quantity must be positive')
  })).default([])
});

export const UpdateCartSchema = z.object({
  userId: z.number().positive('User ID must be positive').optional(),
  date: z.string().optional(),
  products: z.array(z.object({
    productId: z.number().positive('Product ID must be positive'),
    quantity: z.number().positive('Quantity must be positive')
  })).optional()
});

// User schemas
export const UserQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// User CRUD schemas (FakeStore standard)
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  name: z.object({
    firstname: z.string().min(1, 'First name is required'),
    lastname: z.string().min(1, 'Last name is required')
  }),
  address: z.object({
    city: z.string().min(1, 'City is required'),
    street: z.string().min(1, 'Street is required'),
    number: z.number().positive('Street number must be positive'),
    zipcode: z.string().min(1, 'Zipcode is required'),
    geolocation: z.object({
      lat: z.string(),
      long: z.string()
    })
  }),
  phone: z.string().min(1, 'Phone is required')
});

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  username: z.string().min(1, 'Username is required').optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  name: z.object({
    firstname: z.string().min(1, 'First name is required').optional(),
    lastname: z.string().min(1, 'Last name is required').optional()
  }).optional(),
  address: z.object({
    city: z.string().min(1, 'City is required').optional(),
    street: z.string().min(1, 'Street is required').optional(),
    number: z.number().positive('Street number must be positive').optional(),
    zipcode: z.string().min(1, 'Zipcode is required').optional(),
    geolocation: z.object({
      lat: z.string().optional(),
      long: z.string().optional()
    }).optional()
  }).optional(),
  phone: z.string().min(1, 'Phone is required').optional()
});

// Generic response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
});

// Image proxy schema
export const ImageProxyQuerySchema = z.object({
  url: z.string().url('Invalid URL').refine(
    url => url.startsWith('https://fakestoreapi.com/img/'),
    'Only FakeStore API images are allowed'
  )
});

// Type exports for use in controllers
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type ProductId = z.infer<typeof ProductIdSchema>;
export type CategoryParam = z.infer<typeof CategoryParamSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type AddToCartBody = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemBody = z.infer<typeof UpdateCartItemSchema>;
export type CartParams = z.infer<typeof CartParamsSchema>;
export type CartId = z.infer<typeof CartIdSchema>;
export type CartQuery = z.infer<typeof CartQuerySchema>;
export type CreateCartBody = z.infer<typeof CreateCartSchema>;
export type UpdateCartBody = z.infer<typeof UpdateCartSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type LoginBody = z.infer<typeof LoginSchema>;
export type CreateUserBody = z.infer<typeof CreateUserSchema>;
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>;
export type ImageProxyQuery = z.infer<typeof ImageProxyQuerySchema>;
