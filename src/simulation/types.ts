import type { Club } from '../domain/clubs'
import type { Player } from '../domain/players'
import type { Lineup, Tactics, TeamSelectionWarning } from '../domain/tactics'
import type { MatchEvent, MatchResult, MatchStatistics } from '../domain/matches'
import type { RandomSource } from '../core/random'
import type { MatchEngineConfig } from './config'
import type { TeamStrength } from './strength'

export interface SimulationTeam {
  readonly club: Club
  readonly players: readonly Player[]
  readonly lineup: Lineup
  readonly tactics: Tactics
}

export interface MatchSimulationInput {
  readonly home: SimulationTeam
  readonly away: SimulationTeam
  readonly random: RandomSource
  readonly context: { readonly neutralVenue: boolean }
  readonly config?: Partial<MatchEngineConfig>
}

export interface MatchSimulationResult {
  readonly score: MatchResult
  readonly events: readonly MatchEvent[]
  readonly statistics: MatchStatistics
  readonly debug: {
    readonly home: TeamStrength
    readonly away: TeamStrength
    readonly homePossessionProbability: number
    readonly config: MatchEngineConfig
    readonly warnings: readonly TeamSelectionWarning[]
  }
}
