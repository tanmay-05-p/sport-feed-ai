// Provider presets for easy switching
const LLM_PROVIDERS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
  },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
  },
} as const;

type LLMProvider = keyof typeof LLM_PROVIDERS;

const provider = (process.env.LLM_PROVIDER || 'groq') as LLMProvider;
const providerConfig = LLM_PROVIDERS[provider] || LLM_PROVIDERS.groq;

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // LLM Configuration (supports multiple providers)
  llm: {
    provider,
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || providerConfig.baseUrl,
    model: process.env.LLM_MODEL || providerConfig.defaultModel,
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000', 10),
    mockMode: process.env.LLM_MOCK_MODE === 'true',
  },

  // TheSportsDB API (Free)
  sportsDb: {
    baseUrl: 'https://www.thesportsdb.com/api/v1/json',
    apiKey: process.env.SPORTSDB_API_KEY || '3', // Free tier key
  },

  // Cricket API (CricAPI.com - Free tier: 100 req/day)
  cricket: {
    apiKey: process.env.CRICKET_API_KEY || '',
  },

  // Cache settings
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '60', 10),
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
} as const;
