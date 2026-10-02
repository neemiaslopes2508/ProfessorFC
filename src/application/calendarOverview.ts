import type { GameDate } from '../core/date'
import type { ClubId } from '../core/ids'
import type { Match } from '../domain/matches'
import { getScheduledMatch } from './temporalGame'
import type { TemporalGame } from './temporalGame'

export type ClubCalendarEvent =
  | { readonly id: string; readonly date: GameDate; readonly type: 'MATCH'; readonly match: Match; readonly opponentId: ClubId; readonly isHome: boolean }
  | { readonly id: string; readonly date: GameDate; readonly type: 'SEASON_START' | 'SEASON_END'; readonly processed: boolean }

/** Consulta somente leitura: jogos humanos e marcos das suas edições, sem processar eventos. */
export function getClubCalendarEvents(game: TemporalGame, from: GameDate, to: GameDate): readonly ClubCalendarEvent[] {
  const clubId = game.humanClubId
  if (!clubId) return []
  const seasons = new Set(game.competitions.filter(entry => entry.league.season.participantClubIds.includes(clubId)).map(entry => entry.league.season.id))
  const result: ClubCalendarEvent[] = []
  for (const event of game.calendar.eventsBetween(from, to)) {
    if (event.type === 'MATCH') {
      if (event.reference.homeClubId !== clubId && event.reference.awayClubId !== clubId) continue
      const match = getScheduledMatch(game, event.reference.id)
      const isHome = match.homeClubId === clubId
      result.push({ id: event.id, date: event.date, type: 'MATCH', match, isHome, opponentId: isHome ? match.awayClubId : match.homeClubId })
    } else if ((event.type === 'SEASON_START' || event.type === 'SEASON_END') && seasons.has(event.reference.id)) {
      result.push({ id: event.id, date: event.date, type: event.type, processed: game.calendar.isProcessed(event.id) })
    }
  }
  return result
}
