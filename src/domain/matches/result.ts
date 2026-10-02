import { assertIntegerRange } from '../../core/validation'

export interface MatchResult {
  readonly homeGoals: number
  readonly awayGoals: number
}

export function validateMatchResult(result: MatchResult): void {
  assertIntegerRange(result.homeGoals, 0, Number.MAX_SAFE_INTEGER, 'Gols do mandante')
  assertIntegerRange(result.awayGoals, 0, Number.MAX_SAFE_INTEGER, 'Gols do visitante')
}

export function createMatchResult(result: MatchResult): MatchResult {
  validateMatchResult(result)
  return Object.freeze({ ...result })
}
