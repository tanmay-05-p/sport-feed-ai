import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/app.config.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Get client identifier from request
 */
function getClientId(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiter middleware
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientId = getClientId(req);
  const now = Date.now();
  const { windowMs, maxRequests } = config.rateLimit;

  let entry = store.get(clientId);

  // Create new entry or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    store.set(clientId, entry);
    next();
    return;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter,
    });
    return;
  }

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(maxRequests - entry.count),
    'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
  });

  next();
}
