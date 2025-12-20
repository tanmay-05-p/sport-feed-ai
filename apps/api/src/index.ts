import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/app.config.js';
import { rateLimiter } from './middleware/rate-limiter.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';
import queryRouter from './routes/query.route.js';
import healthRouter from './routes/health.route.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/api/query', queryRouter);
app.use('/health', healthRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'SportsFeed AI API',
    version: '1.0.0',
    endpoints: {
      query: 'POST /api/query',
      health: 'GET /health',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║         SportsFeed AI API Server              ║
╠═══════════════════════════════════════════════╣
║  Status:  Running                             ║
║  Port:    ${config.port.toString().padEnd(36)}║
║  Mode:    ${config.nodeEnv.padEnd(36)}║
║  LLM:     ${config.llm.model.padEnd(36)}║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
