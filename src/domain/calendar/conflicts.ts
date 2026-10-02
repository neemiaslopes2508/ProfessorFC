import type { ClubId, MatchId } from '../../core/ids'
import type { GameDate } from '../../core/date'
import type { FootballCalendarEvent } from './event'

export interface CalendarConflict {
  readonly code: 'CLUB_DATE_CONFLICT'
  readonly date: GameDate
  readonly clubId: ClubId
  readonly matchIds: readonly MatchId[]
  readonly eventIds: readonly string[]
  readonly message: string
}

export function validateMatchDateConflicts(events: readonly FootballCalendarEvent[]) {
  const slots = new Map<string, { date: GameDate; clubId: ClubId; matchIds: MatchId[]; eventIds: string[] }>()
  for (const event of events) {
    if (event.type !== 'MATCH') continue
    for (const clubId of [event.reference.homeClubId, event.reference.awayClubId]) {
      const key = JSON.stringify([clubId, event.date])
      const slot = slots.get(key) ?? { date: event.date, clubId, matchIds: [], eventIds: [] }
      slot.matchIds.push(event.reference.id)
      slot.eventIds.push(event.id)
      slots.set(key, slot)
    }
  }
  const errors: CalendarConflict[] = [...slots.values()].filter(slot => slot.matchIds.length > 1).map(slot => Object.freeze({
    ...slot, matchIds: Object.freeze(slot.matchIds), eventIds: Object.freeze(slot.eventIds),
    code: 'CLUB_DATE_CONFLICT' as const,
    message: `Clube ${slot.clubId} possui partidas conflitantes em ${slot.date}: ${slot.matchIds.join(', ')}.`,
  }))
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
}

export class CalendarConflictError extends Error {
  constructor(readonly validation: ReturnType<typeof validateMatchDateConflicts>) {
    super(validation.errors.map(error => error.message).join('; '))
    this.name = 'CalendarConflictError'
  }
}
