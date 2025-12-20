import type { Team, Player, Match } from '@sports-ai/shared';
import { config } from '../config/app.config.js';
import { withCache, createCacheKey } from './cache.service.js';

const { baseUrl, apiKey } = config.sportsDb;

interface SportsDbTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strTeamBadge?: string;
  strCountry?: string;
  strLeague?: string;
  strStadium?: string;
  intFormedYear?: string;
  strDescriptionEN?: string;
}

interface SportsDbPlayer {
  idPlayer: string;
  strPlayer: string;
  strNationality?: string;
  strPosition?: string;
  strTeam?: string;
  dateBorn?: string;
  strHeight?: string;
  strWeight?: string;
  strDescriptionEN?: string;
  strThumb?: string;
}

interface SportsDbEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  dateEvent: string;
  strStatus?: string;
  strLeague: string;
  strVenue?: string;
}

interface SportsDbResponse {
  teams?: SportsDbTeam[];
  player?: SportsDbPlayer[];
  results?: SportsDbEvent[];
  events?: SportsDbEvent[];
}

/**
 * Search for teams by name
 */
export async function searchTeams(teamName: string): Promise<Team[]> {
  const cacheKey = createCacheKey('teams', teamName.toLowerCase());

  return withCache(cacheKey, async () => {
    const url = `${baseUrl}/${apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TheSportsDB error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SportsDbResponse;
    const teams: SportsDbTeam[] = data.teams || [];

    return teams.map(mapTeam);
  });
}

/**
 * Search for players by name
 */
export async function searchPlayers(playerName: string): Promise<Player[]> {
  const cacheKey = createCacheKey('players', playerName.toLowerCase());

  return withCache(cacheKey, async () => {
    const url = `${baseUrl}/${apiKey}/searchplayers.php?p=${encodeURIComponent(playerName)}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TheSportsDB error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SportsDbResponse;
    const players: SportsDbPlayer[] = data.player || [];

    return players.map(mapPlayer);
  });
}

/**
 * Get last 5 events for a team
 */
export async function getTeamLastEvents(teamId: string): Promise<Match[]> {
  const cacheKey = createCacheKey('lastEvents', teamId);

  return withCache(cacheKey, async () => {
    const url = `${baseUrl}/${apiKey}/eventslast.php?id=${teamId}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TheSportsDB error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SportsDbResponse;
    const events: SportsDbEvent[] = data.results || [];

    return events.map(mapMatch);
  });
}

/**
 * Get next 5 events for a team
 */
export async function getTeamNextEvents(teamId: string): Promise<Match[]> {
  const cacheKey = createCacheKey('nextEvents', teamId);

  return withCache(cacheKey, async () => {
    const url = `${baseUrl}/${apiKey}/eventsnext.php?id=${teamId}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TheSportsDB error: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SportsDbResponse;
    const events: SportsDbEvent[] = data.events || [];

    return events.map(mapMatch);
  });
}

/**
 * Get team details by ID
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const cacheKey = createCacheKey('team', teamId);

  return withCache(cacheKey, async () => {
    const url = `${baseUrl}/${apiKey}/lookupteam.php?id=${teamId}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TheSportsDB error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as SportsDbResponse;
    const teams: SportsDbTeam[] = data.teams || [];

    return teams.length > 0 ? mapTeam(teams[0]) : null;
  });
}

// Mapping functions
function mapTeam(t: SportsDbTeam): Team {
  return {
    id: t.idTeam,
    name: t.strTeam,
    shortName: t.strTeamShort,
    logo: t.strTeamBadge,
    country: t.strCountry,
    league: t.strLeague,
    stadium: t.strStadium,
    founded: t.intFormedYear ? parseInt(t.intFormedYear, 10) : undefined,
    description: t.strDescriptionEN,
  };
}

function mapPlayer(p: SportsDbPlayer): Player {
  return {
    id: p.idPlayer,
    name: p.strPlayer,
    nationality: p.strNationality,
    position: p.strPosition,
    team: p.strTeam,
    birthDate: p.dateBorn,
    height: p.strHeight,
    weight: p.strWeight,
    description: p.strDescriptionEN,
    thumbnail: p.strThumb,
  };
}

function mapMatch(e: SportsDbEvent): Match {
  return {
    id: e.idEvent,
    homeTeam: e.strHomeTeam,
    awayTeam: e.strAwayTeam,
    homeScore: e.intHomeScore ? parseInt(e.intHomeScore, 10) : null,
    awayScore: e.intAwayScore ? parseInt(e.intAwayScore, 10) : null,
    date: e.dateEvent,
    status: mapStatus(e.strStatus),
    league: e.strLeague,
    venue: e.strVenue,
  };
}

function mapStatus(status?: string): Match['status'] {
  if (!status) return 'scheduled';
  const s = status.toLowerCase();
  if (s.includes('live') || s.includes('progress')) return 'live';
  if (s.includes('finish') || s.includes('ft') || s.includes('full')) return 'finished';
  if (s.includes('postpon')) return 'postponed';
  if (s.includes('cancel')) return 'cancelled';
  return 'scheduled';
}
