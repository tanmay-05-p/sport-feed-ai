// Query Types
export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
  confidence: ConfidenceLevel;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// Sports Data Types
export interface Article {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  status: MatchStatus;
  league: string;
  venue?: string;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  country?: string;
  league?: string;
  stadium?: string;
  founded?: number;
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  nationality?: string;
  position?: string;
  team?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
  description?: string;
  thumbnail?: string;
}

export interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// Context for LLM
export interface QueryContext {
  articles: Article[];
  matches: Match[];
  teams: Team[];
  players: Player[];
  standings: Standing[];
  lastUpdated: string;
}

// LLM Input/Output
export interface LLMInput {
  userQuery: string;
  context: QueryContext;
}

export interface LLMOutput {
  answer: string;
  sources: string[];
  confidence: ConfidenceLevel;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Chat Types (for frontend)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: ConfidenceLevel;
  timestamp: Date;
}
