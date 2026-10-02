import type { ClubId, CompetitionSeasonId, MatchId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertDate, assertIntegerRange, assertOneOf } from '../../core/validation'
import type { Lineup } from '../tactics/lineup'
import { createLineup, validateLineup } from '../tactics/lineup'
import type { MatchResult } from './result'
import { createMatchResult, validateMatchResult } from './result'
import type { MatchEvent } from './event'
import { createMatchEvent, validateMatchEvent } from './event'
import type { MatchStatistics } from './statistics'
import { createMatchStatistics, validateMatchStatistics } from './statistics'

export const MATCH_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'POSTPONED', 'CANCELLED'] as const
export type MatchStatus = (typeof MATCH_STATUSES)[number]

export interface Match {
  readonly id: MatchId
  readonly competitionSeasonId: CompetitionSeasonId
  readonly round: number
  readonly date: string
  readonly homeClubId: ClubId
  readonly awayClubId: ClubId
  readonly status: MatchStatus
  readonly homeLineup?: Lineup
  readonly awayLineup?: Lineup
  readonly result?: MatchResult
  readonly events: readonly MatchEvent[]
  readonly statistics?: MatchStatistics
}

export function validateMatch(match: Match): void {
  validateId(match.id, 'MatchId')
  validateId(match.competitionSeasonId, 'CompetitionSeasonId')
  validateId(match.homeClubId, 'HomeClubId')
  validateId(match.awayClubId, 'AwayClubId')
  if (match.homeClubId === match.awayClubId) {
    throw new Error('Clube não pode jogar contra ele mesmo.')
  }
  assertIntegerRange(match.round, 1, Number.MAX_SAFE_INTEGER, 'Rodada')
  assertDate(match.date, 'Data da partida')
  assertOneOf(match.status, MATCH_STATUSES, 'Estado da partida')
  if (match.homeLineup !== undefined) validateLineup(match.homeLineup)
  if (match.awayLineup !== undefined) validateLineup(match.awayLineup)
  if (match.status === 'FINISHED' && match.result === undefined) {
    throw new Error('Partida finalizada precisa possuir resultado.')
  }
  if (match.result !== undefined) validateMatchResult(match.result)
  for (const event of match.events) {
    validateMatchEvent(event)
    if (event.clubId !== match.homeClubId && event.clubId !== match.awayClubId) {
      throw new Error('Evento deve pertencer a um dos clubes da partida.')
    }
  }
  if (match.statistics !== undefined) validateMatchStatistics(match.statistics)
}

export function createMatch(match: Match): Match {
  validateMatch(match)
  return Object.freeze({
    ...match,
    homeLineup: match.homeLineup === undefined ? undefined : createLineup(match.homeLineup),
    awayLineup: match.awayLineup === undefined ? undefined : createLineup(match.awayLineup),
    result: match.result === undefined ? undefined : createMatchResult(match.result),
    events: Object.freeze(match.events.map(createMatchEvent)),
    statistics: match.statistics === undefined ? undefined : createMatchStatistics(match.statistics),
  })
}
