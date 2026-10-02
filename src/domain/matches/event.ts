import type { ClubId, PlayerId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertIntegerRange, assertOneOf } from '../../core/validation'

export const MATCH_EVENT_TYPES = [
  'GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'INJURY', 'SHOT',
  'SHOT_ON_TARGET', 'SAVE', 'CORNER', 'FOUL', 'PENALTY',
] as const
export type MatchEventType = (typeof MATCH_EVENT_TYPES)[number]

export interface MatchEvent {
  readonly minute: number
  readonly type: MatchEventType
  readonly clubId: ClubId
  readonly playerId?: PlayerId
  readonly secondaryPlayerId?: PlayerId
  /** SUBSTITUTION: aliases explícitos; playerId entra e secondaryPlayerId sai. */
  readonly playerInId?: PlayerId
  readonly playerOutId?: PlayerId
  readonly metadata?: Readonly<Record<string, unknown>>
}

export function validateMatchEvent(event: MatchEvent): void {
  assertIntegerRange(event.minute, 0, Number.MAX_SAFE_INTEGER, 'Minuto')
  assertOneOf(event.type, MATCH_EVENT_TYPES, 'Tipo de evento')
  validateId(event.clubId, 'ClubId')
  if (event.playerId !== undefined) validateId(event.playerId, 'PlayerId')
  if (event.secondaryPlayerId !== undefined) validateId(event.secondaryPlayerId, 'SecondaryPlayerId')
  if (event.playerInId !== undefined) validateId(event.playerInId, 'PlayerInId')
  if (event.playerOutId !== undefined) validateId(event.playerOutId, 'PlayerOutId')
  if (event.playerInId !== undefined || event.playerOutId !== undefined) {
    if (event.type !== 'SUBSTITUTION' || !event.playerInId || !event.playerOutId || event.playerInId === event.playerOutId) {
      throw new Error('Substituição deve identificar jogadores distintos que entram e saem.')
    }
    if (event.playerId !== event.playerInId || event.secondaryPlayerId !== event.playerOutId) {
      throw new Error('Participantes da substituição estão inconsistentes.')
    }
  }
}

export function createMatchEvent(event: MatchEvent): MatchEvent {
  validateMatchEvent(event)
  return Object.freeze({ ...event })
}
