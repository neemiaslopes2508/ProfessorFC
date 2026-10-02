import type { MatchId } from '../core/ids'
import type { MatchSimulationResult } from '../simulation'
import { getLeagueStandings, recordLeagueMatch } from '../competitions'
import type { LeagueSeason } from '../competitions'

/** Use case de registro, sem simular, selecionar times ou atualizar a base inicial. */
export function registerLeagueMatchResult(league: LeagueSeason, matchId: MatchId, result: MatchSimulationResult) {
  const updated = recordLeagueMatch(league, matchId, result)
  return Object.freeze({ league: updated, standings: getLeagueStandings(updated) })
}
