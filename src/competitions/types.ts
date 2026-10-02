import type { ClubId, CompetitionSeasonId, MatchId } from '../core/ids'
import type { CompetitionSeason } from '../domain/competitions'
import type { MatchEvent, MatchResult, MatchStatistics } from '../domain/matches'

export interface LeagueFixture {
  readonly id: MatchId
  readonly competitionSeasonId: CompetitionSeasonId
  readonly round: number
  readonly leg: 1 | 2
  readonly homeClubId: ClubId
  readonly awayClubId: ClubId
}

export interface LeagueMatchResult {
  readonly score: MatchResult
  readonly events: readonly MatchEvent[]
  readonly statistics: MatchStatistics
}

export interface LeagueRecordedMatch extends LeagueMatchResult {
  readonly matchId: MatchId
}

export interface StandingStats {
  readonly played: number
  readonly wins: number
  readonly draws: number
  readonly losses: number
  readonly goalsFor: number
  readonly goalsAgainst: number
  readonly goalDifference: number
  readonly points: number
}
export type StandingMetric = keyof StandingStats
export type PositionOutcome = 'champion' | 'promotion' | 'relegation' | 'qualification'
export interface LeagueRules {
  readonly tieBreakers: readonly { readonly field: StandingMetric; readonly direction: 'asc' | 'desc' }[]
  readonly positionOutcomes: readonly { readonly position: number; readonly outcomes: readonly PositionOutcome[] }[]
}
export interface LeagueStanding extends StandingStats {
  readonly clubId: ClubId
  readonly position: number
  readonly outcomes: readonly PositionOutcome[]
}

/** Estado de execução separado da CompetitionSeason da base inicial. */
export interface LeagueSeason {
  readonly season: CompetitionSeason
  readonly fixtures: readonly LeagueFixture[]
  readonly results: readonly LeagueRecordedMatch[]
  readonly rules: LeagueRules
}
