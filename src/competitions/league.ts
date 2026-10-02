import { createCompetitionSeason, validateCompetition, validateCompetitionSeason } from '../domain/competitions'
import type { Competition, CompetitionSeason } from '../domain/competitions'
import { createMatchEvent, createMatchResult, createMatchStatistics } from '../domain/matches'
import type { MatchId } from '../core/ids'
import { generateLeagueFixtures } from './fixtures'
import { createLeagueRules, DEFAULT_LEAGUE_RULES, getLeagueStandings } from './standings'
import type { LeagueMatchResult, LeagueRules, LeagueSeason } from './types'

export function createLeagueSeason(competition: Competition, season: CompetitionSeason, rules: LeagueRules = DEFAULT_LEAGUE_RULES): LeagueSeason {
  validateCompetition(competition)
  validateCompetitionSeason(season)
  if (competition.type !== 'LEAGUE' || (competition.format.groupCount ?? 1) !== 1) throw new Error('Apenas LEAGUE de grupo único é suportada.')
  if (season.competitionId !== competition.id) throw new Error('Edição pertence a outra competição.')
  if (season.status !== 'SCHEDULED' || season.championId !== undefined) throw new Error('Nova liga precisa estar SCHEDULED e sem campeão.')
  return Object.freeze({
    season: createCompetitionSeason(season),
    fixtures: generateLeagueFixtures(season.id, season.participantClubIds, competition.format.legs),
    results: Object.freeze([]), rules: createLeagueRules(rules, season.participantClubIds.length),
  })
}

/** A aplicação temporal chama no SEASON_START, sem atribuir campeão antecipado. */
export function beginLeagueSeason(league: LeagueSeason): LeagueSeason {
  if (league.season.status !== 'SCHEDULED') return league
  return Object.freeze({ ...league, season: createCompetitionSeason({ ...league.season, status: 'IN_PROGRESS' }) })
}

/** Transição imutável; recebe somente um resultado válido vinculado ao ID da fixture. */
export function recordLeagueMatch(league: LeagueSeason, matchId: MatchId, result: LeagueMatchResult): LeagueSeason {
  const fixture = league.fixtures.find(match => match.id === matchId)
  if (!fixture) throw new Error('Partida não pertence a esta edição da liga.')
  if (league.results.some(match => match.matchId === matchId)) throw new Error('Partida já contabilizada.')
  if (league.season.status === 'FINISHED') throw new Error('Temporada já finalizada.')
  const score = createMatchResult(result.score)
  const statistics = createMatchStatistics(result.statistics)
  const events = Object.freeze(result.events.map(event => createMatchEvent(structuredClone(event))))
  for (let index = 0; index < events.length; index++) {
    const event = events[index]
    if (event.clubId !== fixture.homeClubId && event.clubId !== fixture.awayClubId) throw new Error('Evento de clube externo ao confronto.')
    if (index && event.minute < events[index - 1].minute) throw new Error('Eventos fora de ordem cronológica.')
  }
  for (const [clubId, goals, shotsOnTarget] of [
    [fixture.homeClubId, score.homeGoals, statistics.shotsOnTarget.home],
    [fixture.awayClubId, score.awayGoals, statistics.shotsOnTarget.away],
  ] as const) {
    if (events.filter(event => event.type === 'GOAL' && event.clubId === clubId).length !== goals || goals > shotsOnTarget) {
      throw new Error('Placar inconsistente com eventos ou finalizações no alvo.')
    }
  }
  const results = Object.freeze([...league.results, Object.freeze({ matchId, score, statistics, events })])
  const updated = { ...league, results }
  const standings = getLeagueStandings(updated)
  const finished = results.length === league.fixtures.length
  return Object.freeze({
    ...updated, season: createCompetitionSeason({
      ...league.season, status: finished ? 'FINISHED' : 'IN_PROGRESS',
      ...(finished ? { championId: standings[0].clubId } : {}),
    }),
  })
}
