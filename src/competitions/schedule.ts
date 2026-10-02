import { addGameDays, compareGameDates } from '../core/date'
import type { GameDate } from '../core/date'
import { assertDate, assertIntegerRange, assertUnique } from '../core/validation'
import type { CompetitionSeasonId, MatchId } from '../core/ids'
import { FOOTBALL_EVENT_ORDER } from '../domain/calendar'
import type { FootballCalendarEvent } from '../domain/calendar'
import type { LeagueSeason } from './types'

export type SeasonScheduleConfig = {
  readonly seasonStartDate: GameDate
} & ({ readonly daysBetweenRounds: number; readonly firstRoundDate?: GameDate; readonly roundDates?: never }
  | { readonly roundDates: readonly { readonly round: number; readonly date: GameDate }[]; readonly daysBetweenRounds?: never; readonly firstRoundDate?: never })

export interface SeasonSchedule {
  readonly competitionSeasonId: CompetitionSeasonId
  readonly seasonStartDate: GameDate
  readonly seasonEndDate: GameDate
  readonly matches: readonly { readonly matchId: MatchId; readonly date: GameDate }[]
  readonly events: readonly FootballCalendarEvent[]
}

export function createSeasonSchedule(league: LeagueSeason, config: SeasonScheduleConfig): SeasonSchedule {
  assertDate(config.seasonStartDate, 'Início da temporada')
  const rounds = [...new Set(league.fixtures.map(fixture => fixture.round))].sort((a, b) => a - b)
  if (!rounds.length) throw new Error('Não é possível agendar uma liga sem partidas.')
  let dates: Map<number, GameDate>
  if (config.roundDates !== undefined) {
    assertUnique(config.roundDates.map(entry => String(entry.round)), 'Datas por rodada')
    if (config.roundDates.length !== rounds.length) throw new Error('Informe uma data para cada rodada.')
    dates = new Map(config.roundDates.map(entry => {
      if (!rounds.includes(entry.round)) throw new Error('Rodada desconhecida na agenda.')
      assertDate(entry.date, 'Data da rodada')
      return [entry.round, entry.date]
    }))
  } else {
    assertIntegerRange(config.daysBetweenRounds, 1, Number.MAX_SAFE_INTEGER, 'Intervalo entre rodadas')
    const first = config.firstRoundDate ?? config.seasonStartDate
    assertDate(first, 'Primeira rodada')
    dates = new Map(rounds.map((round, index) => [round, addGameDays(first, index * config.daysBetweenRounds)]))
  }
  let previous = config.seasonStartDate
  for (const [index, round] of rounds.entries()) {
    const date = dates.get(round)!
    if (compareGameDates(date, previous) < 0 || (index > 0 && compareGameDates(date, previous) === 0)) throw new Error('Rodadas devem ser posteriores ao início e cronologicamente crescentes.')
    previous = date
  }
  const seasonEndDate = previous
  const matches = Object.freeze(league.fixtures.map(fixture => Object.freeze({ matchId: fixture.id, date: dates.get(fixture.round)! })))
  const events: FootballCalendarEvent[] = [
    { id: `${league.season.id}:season-start`, date: config.seasonStartDate, type: 'SEASON_START', order: FOOTBALL_EVENT_ORDER.SEASON_START,
      reference: { kind: 'CompetitionSeason', id: league.season.id } },
  ]
  for (const round of rounds) {
    const date = dates.get(round)!
    events.push({ id: `${league.season.id}:round:${round}:start`, date, type: 'ROUND_START', order: FOOTBALL_EVENT_ORDER.ROUND_START,
      reference: { kind: 'CompetitionSeason', id: league.season.id, round } })
    for (const fixture of league.fixtures.filter(fixture => fixture.round === round)) events.push({
      id: `${fixture.id}:calendar`, date, type: 'MATCH', order: FOOTBALL_EVENT_ORDER.MATCH,
      reference: { kind: 'Match', id: fixture.id, competitionSeasonId: league.season.id, round,
        homeClubId: fixture.homeClubId, awayClubId: fixture.awayClubId },
    })
    events.push({ id: `${league.season.id}:round:${round}:end`, date, type: 'ROUND_END', order: FOOTBALL_EVENT_ORDER.ROUND_END,
      reference: { kind: 'CompetitionSeason', id: league.season.id, round } })
  }
  events.push({ id: `${league.season.id}:season-end`, date: seasonEndDate, type: 'SEASON_END', order: FOOTBALL_EVENT_ORDER.SEASON_END,
    reference: { kind: 'CompetitionSeason', id: league.season.id } })
  return Object.freeze({ competitionSeasonId: league.season.id, seasonStartDate: config.seasonStartDate, seasonEndDate, matches,
    events: Object.freeze(events.map(event => { Object.freeze(event.reference); return Object.freeze(event) })),
  })
}

/** Rodadas são derivadas da agenda e do registro de resultados. */
export function getLeagueRoundState(league: LeagueSeason, schedule: SeasonSchedule, date: GameDate) {
  assertDate(date, 'Data de consulta de rodada')
  const completed = new Set(league.results.map(result => result.matchId))
  const byId = new Map(schedule.matches.map(match => [match.matchId, match.date]))
  const rounds = [...new Set(league.fixtures.map(fixture => fixture.round))].sort((a, b) => a - b).map(round => {
    const matches = league.fixtures.filter(fixture => fixture.round === round)
    const finished = matches.filter(match => completed.has(match.id))
    const pending = matches.filter(match => !completed.has(match.id))
    return Object.freeze({ round, date: byId.get(matches[0].id)!, matches: Object.freeze(matches),
      completed: Object.freeze(finished), pending: Object.freeze(pending), finished: pending.length === 0 })
  })
  const current = rounds.filter(round => compareGameDates(round.date, date) <= 0).at(-1)
  const next = rounds.find(round => compareGameDates(round.date, date) > 0)
  return Object.freeze({ rounds: Object.freeze(rounds), current, next })
}
