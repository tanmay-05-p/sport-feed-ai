import type { QueryContext, QueryResponse, ConfidenceLevel } from '@sports-ai/shared';
import { calculateConfidence, extractSources } from '@sports-ai/shared';
import { createEmptyContext } from '@sports-ai/prompts';
import { searchTeams, searchPlayers, getTeamLastEvents } from './sports-db.service.js';
import { searchNews, getLatestNews } from './rss-feed.service.js';
import { getLiveCricketMatches, searchCricketMatches } from './cricket.service.js';
import { queryLLM } from './llm.service.js';

/**
 * Extract keywords from query for searching
 */
function extractKeywords(query: string): string[] {
  // Remove common words and punctuation, but keep sports-related terms
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'is',
    'are',
    'was',
    'were',
    'what',
    'who',
    'when',
    'where',
    'how',
    'why',
    'about',
    'tell',
    'me',
    'show',
    'get',
    'find',
    'did',
    'does',
    'do',
    'has',
    'have',
    'had',
    'give',
    'can',
    'you',
    'please',
    'last',
    'recent',
    'latest',
    'next',
    'upcoming',
    'previous',
  ]);

  // Words to exclude from search term (keep for intent detection)
  const searchExclude = new Set([
    'game',
    'games',
    'match',
    'matches',
    'score',
    'scores',
    'result',
    'results',
    'fixture',
    'fixtures',
    'news',
    'table',
    'format',
    'list',
    'tabular',
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word) && !searchExclude.has(word));

  return [...new Set(words)];
}

/**
 * Determine query intent
 */
function detectIntent(
  query: string
): 'news' | 'team' | 'player' | 'match' | 'cricket' | 'general' {
  const q = query.toLowerCase();

  // Cricket-specific detection (prioritize this for cricket queries)
  const cricketTeams = ['ind', 'india', 'aus', 'australia', 'eng', 'england', 'sa', 'south africa',
    'pak', 'pakistan', 'nz', 'new zealand', 'wi', 'west indies', 'ban', 'bangladesh',
    'sl', 'sri lanka', 'afg', 'afghanistan', 'ire', 'ireland', 'zim', 'zimbabwe'];
  const cricketTerms = ['cricket', 'ipl', 'odi', 't20', 'test match', 'innings', 'wicket', 'runs', 'bcci', 'icc'];

  const hasCricketTeam = cricketTeams.some(team => q.includes(team));
  const hasCricketTerm = cricketTerms.some(term => q.includes(term));
  const hasScoreQuery = q.includes('score') || q.includes('vs') || q.includes('match');

  if ((hasCricketTeam && hasScoreQuery) || hasCricketTerm) {
    return 'cricket';
  }

  if (
    q.includes('news') ||
    q.includes('latest') ||
    q.includes('headline') ||
    q.includes('update')
  ) {
    return 'news';
  }

  if (
    q.includes('player') ||
    q.includes('who is') ||
    q.includes('biography') ||
    q.includes('stats')
  ) {
    return 'player';
  }

  if (
    q.includes('score') ||
    q.includes('result') ||
    q.includes('match') ||
    q.includes('fixture') ||
    q.includes('game') ||
    q.includes('vs') ||
    q.includes('versus') ||
    q.includes('last') ||
    q.includes('recent') ||
    q.includes('won') ||
    q.includes('lost') ||
    q.includes('beat')
  ) {
    return 'match';
  }

  if (
    q.includes('team') ||
    q.includes('club') ||
    q.includes('squad') ||
    q.includes('stadium')
  ) {
    return 'team';
  }

  return 'general';
}

/**
 * Gather context data based on query
 */
async function gatherContext(query: string): Promise<QueryContext> {
  const context = createEmptyContext();
  const keywords = extractKeywords(query);
  const intent = detectIntent(query);

  const searchTerm = keywords.join(' ') || query;

  try {
    // Fetch based on intent
    const promises: Promise<void>[] = [];

    // Cricket-specific handling
    if (intent === 'cricket') {
      promises.push(
        searchCricketMatches(searchTerm).then((matches) => {
          context.matches = matches;
        })
      );
      // Also get all live matches if specific search returns empty
      promises.push(
        getLiveCricketMatches().then((matches) => {
          if (context.matches.length === 0) {
            context.matches = matches;
          }
        })
      );
      // Search cricket news
      promises.push(
        searchNews(searchTerm + ' cricket').then((articles) => {
          context.articles = articles;
        })
      );
    } else {
      // Always fetch some news for non-cricket queries
      const newsPromise =
        intent === 'news' || keywords.length === 0
          ? getLatestNews(10)
          : searchNews(searchTerm);

      promises.push(
        newsPromise.then((articles) => {
          context.articles = articles;
        })
      );

      if (intent === 'team' || intent === 'match' || intent === 'general') {
        promises.push(
          searchTeams(searchTerm).then(async (teams) => {
            context.teams = teams.slice(0, 5);
            // If we found teams, get their recent matches
            if (teams.length > 0) {
              const matches = await getTeamLastEvents(teams[0].id);
              context.matches = matches;
            }
          })
        );
      }

      if (intent === 'player' || intent === 'general') {
        promises.push(
          searchPlayers(searchTerm).then((players) => {
            context.players = players.slice(0, 5);
          })
        );
      }
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error gathering context:', error);
  }

  context.lastUpdated = new Date().toISOString();
  return context;
}

/**
 * Process a user query and return a response
 */
export async function processQuery(query: string): Promise<QueryResponse> {
  // Gather context from various sources
  const context = await gatherContext(query);

  // Check if we have any data
  const hasData =
    context.articles.length > 0 ||
    context.matches.length > 0 ||
    context.teams.length > 0 ||
    context.players.length > 0;

  if (!hasData) {
    return {
      answer:
        "I couldn't find any relevant information for your query. Please try rephrasing or asking about a specific team, player, or match.",
      sources: [],
      confidence: 'low',
    };
  }

  // Query the LLM with context
  const llmResponse = await queryLLM(query, context);

  // Calculate confidence based on data quality
  const dataConfidence = calculateConfidence(context.articles, context.matches);

  // Use the lower of LLM confidence and data confidence
  const confidenceOrder: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1 };
  const finalConfidence: ConfidenceLevel =
    confidenceOrder[llmResponse.confidence] <= confidenceOrder[dataConfidence]
      ? llmResponse.confidence
      : dataConfidence;

  // Extract sources if not provided by LLM
  const sources =
    llmResponse.sources.length > 0
      ? llmResponse.sources
      : extractSources(context.articles);

  return {
    answer: llmResponse.answer,
    sources,
    confidence: finalConfidence,
  };
}
