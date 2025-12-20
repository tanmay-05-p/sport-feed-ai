import type { QueryContext, LLMOutput } from '@sports-ai/shared';
import { buildPrompt, getSystemPrompt } from '@sports-ai/prompts';
import { config } from '../config/app.config.js';

// OpenAI-compatible API types (works with Groq, OpenRouter, Together, OpenAI, Ollama, etc.)
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Query the LLM with context
 */
export async function queryLLM(
  userQuery: string,
  context: QueryContext
): Promise<LLMOutput> {
  // Use mock mode if enabled or if no API key configured (except for local Ollama)
  const needsApiKey = config.llm.provider !== 'ollama';
  if (config.llm.mockMode || (needsApiKey && !config.llm.apiKey)) {
    if (needsApiKey && !config.llm.apiKey) {
      console.log(`No LLM_API_KEY configured for ${config.llm.provider}, using mock mode`);
    }
    return generateMockResponse(userQuery, context);
  }

  const prompt = buildPrompt(userQuery, context);
  const systemPrompt = getSystemPrompt();

  try {
    const response = await callLLM(prompt, systemPrompt);
    return parseResponse(response);
  } catch (error) {
    console.error('LLM query failed:', error);
    console.log('Falling back to mock response...');
    return generateMockResponse(userQuery, context);
  }
}

/**
 * Generate a mock response based on context data
 */
function generateMockResponse(
  userQuery: string,
  context: QueryContext
): LLMOutput {
  const query = userQuery.toLowerCase();
  const sources: string[] = [];

  // Collect available sources
  context.articles.slice(0, 3).forEach((a) => {
    if (!sources.includes(a.source)) {
      sources.push(a.source);
    }
  });

  // Generate response based on available data
  let answer = '';

  // Check if we have news articles
  if (context.articles.length > 0) {
    const topArticles = context.articles.slice(0, 3);
    answer = `Here's what I found:\n\n`;
    topArticles.forEach((article, index) => {
      answer += `${index + 1}. **${article.title}** (${article.source})\n`;
      if (article.description) {
        answer += `   ${article.description.slice(0, 150)}${article.description.length > 150 ? '...' : ''}\n`;
      }
      answer += '\n';
    });
  }

  // Check for team information
  if (context.teams.length > 0 && (query.includes('team') || query.includes('club'))) {
    const team = context.teams[0];
    answer += `\n**${team.name}**`;
    if (team.country) answer += ` (${team.country})`;
    if (team.league) answer += ` - ${team.league}`;
    if (team.stadium) answer += `\nStadium: ${team.stadium}`;
    if (team.founded) answer += `\nFounded: ${team.founded}`;
    answer += '\n';
  }

  // Check for player information
  if (context.players.length > 0 && (query.includes('player') || query.includes('who'))) {
    const player = context.players[0];
    answer += `\n**${player.name}**`;
    if (player.position) answer += ` - ${player.position}`;
    if (player.team) answer += ` (${player.team})`;
    if (player.nationality) answer += `\nNationality: ${player.nationality}`;
    answer += '\n';
  }

  // Check for match information - show all matches in table format
  if (context.matches.length > 0) {
    const isResultQuery = query.includes('result') || query.includes('score') ||
                          query.includes('game') || query.includes('match') ||
                          query.includes('last') || query.includes('recent');

    if (isResultQuery) {
      // Show matches in a table format
      answer += `\n**Recent Match Results:**\n\n`;
      answer += `| Date | Home | Score | Away | Competition |\n`;
      answer += `|------|------|-------|------|-------------|\n`;
      context.matches.slice(0, 5).forEach((match) => {
        const score = match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore} - ${match.awayScore}`
          : 'TBD';
        const date = match.date ? match.date.slice(0, 10) : '-';
        answer += `| ${date} | ${match.homeTeam} | ${score} | ${match.awayTeam} | ${match.league} |\n`;
      });
    } else {
      // Simple list format
      answer += `\n**Recent Matches:**\n`;
      context.matches.slice(0, 5).forEach((match) => {
        const score = match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore} - ${match.awayScore}`
          : 'vs';
        answer += `- ${match.homeTeam} ${score} ${match.awayTeam} (${match.league})\n`;
      });
    }
  }

  // Fallback if no data
  if (!answer) {
    answer =
      "I found some information but couldn't generate a detailed response. Please check the available sources for more details.";
  }

  return {
    answer: answer.trim(),
    sources: sources.length > 0 ? sources : ['SportsFeed AI'],
    confidence: context.articles.length > 2 ? 'high' : context.articles.length > 0 ? 'medium' : 'low',
  };
}

/**
 * Call LLM using OpenAI-compatible API (works with all providers)
 */
async function callLLM(prompt: string, system: string): Promise<string> {
  const url = `${config.llm.baseUrl}/chat/completions`;

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if API key is configured
  if (config.llm.apiKey) {
    headers['Authorization'] = `Bearer ${config.llm.apiKey}`;
  }

  // OpenRouter requires additional headers
  if (config.llm.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://sportsfeed-ai.local';
    headers['X-Title'] = 'SportsFeed AI';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.llm.timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.llm.model,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${config.llm.provider}): ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LLM request timed out');
    }
    throw error;
  }
}

/**
 * Parse LLM response into structured output
 */
function parseResponse(response: string): LLMOutput {
  // Try to extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*"answer"[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        answer: parsed.answer || response,
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        confidence: validateConfidence(parsed.confidence),
      };
    } catch {
      // JSON parsing failed, fall through to plain text handling
    }
  }

  // Fallback: treat entire response as answer
  return {
    answer: response.trim(),
    sources: [],
    confidence: 'medium',
  };
}

/**
 * Validate confidence level
 */
function validateConfidence(value: unknown): LLMOutput['confidence'] {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

/**
 * Check if LLM service is available
 */
export async function checkLLMHealth(): Promise<boolean> {
  if (config.llm.mockMode) {
    return true; // Mock mode is always "healthy"
  }

  // For cloud providers, check if API key is configured
  if (config.llm.provider !== 'ollama') {
    return !!config.llm.apiKey;
  }

  // Ollama health check (local)
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
