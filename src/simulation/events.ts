import type { ClubId } from '../core/ids'
import { drawRandom } from '../core/random'
import type { RandomSource } from '../core/random'
import { createMatchResult, createMatchStatistics } from '../domain/matches'
import type { MatchEvent } from '../domain/matches'
import { POSITION_CONTRIBUTIONS } from './config'
import type { PlayerStrength } from './strength'

export function chooseParticipant(
  players: readonly PlayerStrength[], action: 'offensiveParticipation' | 'foulParticipation', random: RandomSource,
): PlayerStrength {
  const candidates = players.filter(player => POSITION_CONTRIBUTIONS[player.position][action] > 0)
  const weights = candidates.map(player => POSITION_CONTRIBUTIONS[player.position][action] * player.strength)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let target = drawRandom(random) * total
  for (let index = 0; index < candidates.length; index++) {
    target -= weights[index]
    if (target < 0) return candidates[index]
  }
  return candidates[candidates.length - 1]
}

/** Placar e contagens têm uma única fonte: os eventos produzidos. */
export function summarizeEvents(events: readonly MatchEvent[], homeClubId: ClubId, homePossession: number) {
  const count = (type: MatchEvent['type']) => ({
    home: events.filter(event => event.type === type && event.clubId === homeClubId).length,
    away: events.filter(event => event.type === type && event.clubId !== homeClubId).length,
  })
  const goals = count('GOAL')
  return {
    score: createMatchResult({ homeGoals: goals.home, awayGoals: goals.away }),
    statistics: createMatchStatistics({
      possession: { home: homePossession, away: 100 - homePossession },
      shots: count('SHOT'), shotsOnTarget: count('SHOT_ON_TARGET'), corners: count('CORNER'),
      fouls: count('FOUL'), yellowCards: count('YELLOW_CARD'), redCards: count('RED_CARD'),
    }),
  }
}
