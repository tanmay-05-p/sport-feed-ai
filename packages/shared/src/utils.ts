import type { ConfidenceLevel, Article, Match } from './types.js';

/**
 * Calculate confidence level based on data quality
 */
export function calculateConfidence(
  articles: Article[],
  matches: Match[],
  maxAgeHours: number = 24
): ConfidenceLevel {
  const now = new Date();
  const maxAge = maxAgeHours * 60 * 60 * 1000;

  // Count recent articles
  const recentArticles = articles.filter((article) => {
    const articleDate = new Date(article.publishedAt);
    return now.getTime() - articleDate.getTime() < maxAge;
  });

  // Count recent matches
  const recentMatches = matches.filter((match) => {
    const matchDate = new Date(match.date);
    return now.getTime() - matchDate.getTime() < maxAge;
  });

  const totalRecent = recentArticles.length + recentMatches.length;

  if (totalRecent >= 3) return 'high';
  if (totalRecent >= 1) return 'medium';
  return 'low';
}

/**
 * Extract unique sources from articles
 */
export function extractSources(articles: Article[]): string[] {
  const sources = new Set(articles.map((a) => a.source));
  return Array.from(sources);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format match score
 */
export function formatScore(homeScore: number | null, awayScore: number | null): string {
  if (homeScore === null || awayScore === null) return 'vs';
  return `${homeScore} - ${awayScore}`;
}

/**
 * Truncate text to max length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}
