import type { ClubId, CompetitionSeasonId, MatchId } from '../../core/ids'
import type { GameDate } from '../../core/date'

/** Calendar aceita outros tipos/refs sem conhecer os sistemas que os processam. */
export interface CalendarEvent {
  readonly id: string
  readonly date: GameDate
  readonly type: string
  readonly order?: number
  readonly reference?: { readonly kind: string; readonly id: string }
}

export type FootballCalendarEvent =
  | (CalendarEvent & { readonly type: 'MATCH'; readonly reference: {
    readonly kind: 'Match'; readonly id: MatchId; readonly competitionSeasonId: CompetitionSeasonId
    readonly round: number; readonly homeClubId: ClubId; readonly awayClubId: ClubId
  } })
  | (CalendarEvent & { readonly type: 'ROUND_START' | 'ROUND_END'; readonly reference: {
    readonly kind: 'CompetitionSeason'; readonly id: CompetitionSeasonId; readonly round: number
  } })
  | (CalendarEvent & { readonly type: 'SEASON_START' | 'SEASON_END'; readonly reference: {
    readonly kind: 'CompetitionSeason'; readonly id: CompetitionSeasonId
  } })

export const FOOTBALL_EVENT_ORDER = Object.freeze({ SEASON_START: 0, ROUND_START: 10, MATCH: 20, ROUND_END: 30, SEASON_END: 40 })
