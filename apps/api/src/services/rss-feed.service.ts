import Parser from 'rss-parser';
import type { Article } from '@sports-ai/shared';
import { withCache, createCacheKey } from './cache.service.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'SportsFeedAI/1.0',
  },
});

// Free RSS feeds for sports news
const RSS_FEEDS = {
  espn: 'https://www.espn.com/espn/rss/news',
  bbcSport: 'https://feeds.bbci.co.uk/sport/rss.xml',
  skySports: 'https://www.skysports.com/rss/12040', // Football
  guardian: 'https://www.theguardian.com/football/rss',
} as const;

type FeedSource = keyof typeof RSS_FEEDS;

interface RSSItem {
  title?: string;
  contentSnippet?: string;
  content?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
}

/**
 * Fetch articles from a single RSS feed
 */
async function fetchFeed(source: FeedSource): Promise<Article[]> {
  const url = RSS_FEEDS[source];
  const cacheKey = createCacheKey('rss', source);

  return withCache(cacheKey, async () => {
    try {
      const feed = await parser.parseURL(url);
      const items: RSSItem[] = feed.items || [];

      return items.slice(0, 10).map((item) => ({
        title: item.title || 'Untitled',
        description: item.contentSnippet || item.content || '',
        source: formatSourceName(source),
        url: item.link || '',
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      }));
    } catch (error) {
      console.error(`Failed to fetch RSS feed from ${source}:`, error);
      return [];
    }
  });
}

/**
 * Fetch articles from all RSS feeds
 */
export async function fetchAllNews(): Promise<Article[]> {
  const sources = Object.keys(RSS_FEEDS) as FeedSource[];

  const results = await Promise.allSettled(sources.map((source) => fetchFeed(source)));

  const articles: Article[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  // Sort by date, newest first
  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Search articles by keyword
 */
export async function searchNews(keyword: string): Promise<Article[]> {
  const allArticles = await fetchAllNews();
  const lowerKeyword = keyword.toLowerCase();

  return allArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.description.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Get latest news (limited)
 */
export async function getLatestNews(limit: number = 20): Promise<Article[]> {
  const articles = await fetchAllNews();
  return articles.slice(0, limit);
}

/**
 * Format source name for display
 */
function formatSourceName(source: FeedSource): string {
  const names: Record<FeedSource, string> = {
    espn: 'ESPN',
    bbcSport: 'BBC Sport',
    skySports: 'Sky Sports',
    guardian: 'The Guardian',
  };
  return names[source];
}
