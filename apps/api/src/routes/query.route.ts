import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { processQuery } from '../services/query-processor.service.js';
import { createError } from '../middleware/error-handler.middleware.js';

const router = Router();

// Request validation schema
const querySchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .max(500, 'Query is too long (max 500 characters)'),
});

/**
 * POST /api/query
 * Main AI query endpoint
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const result = querySchema.safeParse(req.body);
    if (!result.success) {
      const error = result.error.errors[0];
      throw createError(error.message, 400, 'VALIDATION_ERROR');
    }

    const { query } = result.data;

    // Process the query
    const response = await processQuery(query);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
