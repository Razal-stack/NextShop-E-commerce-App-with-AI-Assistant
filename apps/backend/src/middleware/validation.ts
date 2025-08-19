/**
 * Validation middleware using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Generic validation middleware factory
export const validateRequest = (schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query if schema provided
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate params if schema provided
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages
        });
      }

      // Handle other validation errors
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid request data'
      });
    }
  };
};

// Specific validation helpers
export const validateBody = (schema: z.ZodSchema) => validateRequest({ body: schema });
export const validateQuery = (schema: z.ZodSchema) => validateRequest({ query: schema });
export const validateParams = (schema: z.ZodSchema) => validateRequest({ params: schema });
export const validateAll = (bodySchema: z.ZodSchema, querySchema?: z.ZodSchema, paramsSchema?: z.ZodSchema) => 
  validateRequest({ 
    body: bodySchema, 
    query: querySchema, 
    params: paramsSchema 
  });
