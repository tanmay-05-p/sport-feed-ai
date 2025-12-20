import { Router, type Request, type Response } from 'express';
import { checkLLMHealth } from '../services/llm.service.js';
import { cacheService } from '../services/cache.service.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  const llmHealthy = await checkLLMHealth();
  const cacheStats = cacheService.stats();

  const status = llmHealthy ? 'healthy' : 'degraded';

  res.status(llmHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      llm: llmHealthy ? 'connected' : 'disconnected',
      cache: {
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
      },
    },
  });
});

export default router;
