import type { Match } from '@sports-ai/shared';
import { withCache, createCacheKey } from './cache.service.js';
import { config } from '../config/app.config.js';

// CricAPI.com - Free tier: 100 requests/day
const CRICAPI_BASE = 'https://api.cricapi.com/v1';

interface CricApiMatch {
  id: string;
  name: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: {
    name: string;
    shortname: string;
    img: string;
  }[];
  score?: {
    r: number;
    w: number;
    o: number;
    inning: string;
  }[];
  matchType?: string;
  series_id?: string;
  matchStarted?: boolean;
  matchEnded?: boolean;
}

interface CricApiResponse {
  apikey: string;
  data: CricApiMatch[];
  status: string;
  info?: {
    hitsToday: number;
    hitsLimit: number;
  };
}

/**
 * Get live/current cricket matches
 */
export async function getLiveCricketMatches(): Promise<Match[]> {
  const cacheKey = createCacheKey('cricket', 'live');

  return withCache(
    cacheKey,
    async () => {
      const apiKey = config.cricket?.apiKey;

      // If no API key, return mock data for demo
      if (!apiKey) {
        console.log('No CRICKET_API_KEY configured, using demo data');
        return getDemoCricketMatches();
      }

      try {
        const response = await fetch(
          `${CRICAPI_BASE}/currentMatches?apikey=${apiKey}&offset=0`,
          { signal: AbortSignal.timeout(10000) }
        );

        if (!response.ok) {
          console.error(`CricAPI error: ${response.status}`);
          return getDemoCricketMatches();
        }

        const data = (await response.json()) as CricApiResponse;

        if (data.status !== 'success' || !data.data) {
          return getDemoCricketMatches();
        }

        return data.data.map(mapCricApiMatch);
      } catch (error) {
        console.error('Cricket API error:', error);
        return getDemoCricketMatches();
      }
    },
    60
  ); // Cache for 1 minute
}

/**
 * Demo cricket data when no API key is configured
 */
function getDemoCricketMatches(): Match[] {
  return [
    {
      id: 'demo-1',
      homeTeam: 'India',
      awayTeam: 'South Africa',
      homeScore: null,
      awayScore: null,
      date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      league: 'T20 International',
      venue: 'Demo - Configure CRICKET_API_KEY for live scores',
    },
  ];
}

/**
 * Map CricAPI match to our Match type
 */
function mapCricApiMatch(m: CricApiMatch): Match {
  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let homeTeam = m.teams?.[0] || 'Team 1';
  let awayTeam = m.teams?.[1] || 'Team 2';

  // Extract scores from score array
  if (m.score && m.score.length > 0) {
    const score1 = m.score[0];
    const score2 = m.score[1];

    if (score1) {
      homeScore = score1.r;
      // Update team name from inning if available
      if (score1.inning) {
        homeTeam = score1.inning.replace(' Inning 1', '').replace(' Inning 2', '').trim();
      }
    }
    if (score2) {
      awayScore = score2.r;
      if (score2.inning) {
        awayTeam = score2.inning.replace(' Inning 1', '').replace(' Inning 2', '').trim();
      }
    }
  }

  // Use teamInfo if available
  if (m.teamInfo && m.teamInfo.length >= 2) {
    homeTeam = m.teamInfo[0].name || homeTeam;
    awayTeam = m.teamInfo[1].name || awayTeam;
  }

  return {
    id: m.id,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    date: m.date || new Date().toISOString().split('T')[0],
    status: mapCricketStatus(m.status, m.matchStarted, m.matchEnded),
    league: m.matchType || 'Cricket',
    venue: m.venue,
  };
}

/**
 * Search for cricket matches by team name
 */
export async function searchCricketMatches(teamName: string): Promise<Match[]> {
  const matches = await getLiveCricketMatches();
  const searchTerm = teamName.toLowerCase();

  // Common team abbreviations
  const teamAliases: Record<string, string[]> = {
    india: ['ind', 'india', 'bcci'],
    australia: ['aus', 'australia'],
    england: ['eng', 'england'],
    'south africa': ['sa', 'south africa', 'rsa', 'proteas'],
    pakistan: ['pak', 'pakistan'],
    'new zealand': ['nz', 'new zealand', 'blackcaps'],
    'west indies': ['wi', 'west indies', 'windies'],
    bangladesh: ['ban', 'bangladesh'],
    'sri lanka': ['sl', 'sri lanka'],
    afghanistan: ['afg', 'afghanistan'],
  };

  // Expand search term to include aliases
  let searchTerms = [searchTerm];
  for (const [full, aliases] of Object.entries(teamAliases)) {
    if (aliases.includes(searchTerm) || full.includes(searchTerm)) {
      searchTerms = [...searchTerms, full, ...aliases];
    }
  }

  return matches.filter((match) => {
    const matchText = `${match.homeTeam} ${match.awayTeam}`.toLowerCase();
    return searchTerms.some((term) => matchText.includes(term));
  });
}

/**
 * Map cricket status to standard status
 */
function mapCricketStatus(
  status: string,
  matchStarted?: boolean,
  matchEnded?: boolean
): Match['status'] {
  // Use boolean flags if available
  if (matchEnded) return 'finished';
  if (matchStarted) return 'live';

  const s = (status || '').toLowerCase();
  if (s.includes('live') || s.includes('in progress') || s.includes('day')) {
    return 'live';
  }
  if (s.includes('won') || s.includes('draw') || s.includes('ended') || s.includes('result')) {
    return 'finished';
  }
  if (s.includes('upcoming') || s.includes('starts') || s.includes('match not started')) {
    return 'scheduled';
  }
  if (s.includes('rain') || s.includes('delay') || s.includes('abandon')) {
    return 'postponed';
  }
  return 'scheduled';
}

/**
 * Format cricket score for display
 */
export function formatCricketScore(match: Match): string {
  const team1 = match.homeTeam;
  const team2 = match.awayTeam;

  if (match.status === 'live') {
    return `${team1} vs ${team2} - LIVE`;
  }

  if (match.homeScore !== null && match.awayScore !== null) {
    return `${team1} ${match.homeScore} - ${team2} ${match.awayScore}`;
  }

  return `${team1} vs ${team2}`;
}
