import type { QueryContext, Article, Match, Team, Player, Standing } from '@sports-ai/shared';
import { SYSTEM_PROMPT, QUERY_WRAPPER_PROMPT } from './system-prompt.js';

/**
 * Format articles for context
 */
function formatArticles(articles: Article[]): string {
  if (articles.length === 0) return 'No news articles available.';

  return articles
    .map(
      (a, i) =>
        `[Article ${i + 1}]
Title: ${a.title}
Source: ${a.source}
Date: ${a.publishedAt}
Summary: ${a.description}`
    )
    .join('\n\n');
}

/**
 * Format matches for context
 */
function formatMatches(matches: Match[]): string {
  if (matches.length === 0) return 'No match data available.';

  return matches
    .map(
      (m) =>
        `- ${m.homeTeam} ${m.homeScore ?? '?'} - ${m.awayScore ?? '?'} ${m.awayTeam} (${m.league}, ${m.status}, ${m.date})`
    )
    .join('\n');
}

/**
 * Format teams for context
 */
function formatTeams(teams: Team[]): string {
  if (teams.length === 0) return 'No team data available.';

  return teams
    .map((t) => {
      let info = `- ${t.name}`;
      if (t.country) info += ` (${t.country})`;
      if (t.league) info += ` - ${t.league}`;
      if (t.stadium) info += ` - Stadium: ${t.stadium}`;
      if (t.description) info += `\n  ${t.description}`;
      return info;
    })
    .join('\n');
}

/**
 * Format players for context
 */
function formatPlayers(players: Player[]): string {
  if (players.length === 0) return 'No player data available.';

  return players
    .map((p) => {
      let info = `- ${p.name}`;
      if (p.position) info += ` (${p.position})`;
      if (p.team) info += ` - ${p.team}`;
      if (p.nationality) info += ` - ${p.nationality}`;
      if (p.description) info += `\n  ${p.description}`;
      return info;
    })
    .join('\n');
}

/**
 * Format standings for context
 */
function formatStandings(standings: Standing[]): string {
  if (standings.length === 0) return 'No standings data available.';

  const header = 'Pos | Team | P | W | D | L | GF | GA | GD | Pts';
  const separator = '--- | ---- | - | - | - | - | -- | -- | -- | ---';
  const rows = standings.map(
    (s) =>
      `${s.position} | ${s.team} | ${s.played} | ${s.won} | ${s.drawn} | ${s.lost} | ${s.goalsFor} | ${s.goalsAgainst} | ${s.goalDifference} | ${s.points}`
  );

  return [header, separator, ...rows].join('\n');
}

/**
 * Build the full context string from query context
 */
export function buildContextString(context: QueryContext): string {
  const sections = [
    `## News Articles\n${formatArticles(context.articles)}`,
    `## Recent Matches\n${formatMatches(context.matches)}`,
    `## Teams\n${formatTeams(context.teams)}`,
    `## Players\n${formatPlayers(context.players)}`,
    `## Standings\n${formatStandings(context.standings)}`,
    `\nData last updated: ${context.lastUpdated}`,
  ];

  return sections.join('\n\n');
}

/**
 * Build the complete prompt for the LLM
 */
export function buildPrompt(query: string, context: QueryContext): string {
  const contextString = buildContextString(context);

  return QUERY_WRAPPER_PROMPT.replace('{query}', query).replace('{context}', contextString);
}

/**
 * Get the system prompt
 */
export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Create an empty context
 */
export function createEmptyContext(): QueryContext {
  return {
    articles: [],
    matches: [],
    teams: [],
    players: [],
    standings: [],
    lastUpdated: new Date().toISOString(),
  };
}
