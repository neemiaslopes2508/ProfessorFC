import { assertIntegerRange } from '../../core/validation'

export interface TeamStatistic {
  readonly home: number
  readonly away: number
}

export const MATCH_COUNT_STATISTICS = [
  'shots', 'shotsOnTarget', 'corners', 'fouls', 'yellowCards', 'redCards',
] as const

export interface MatchStatistics {
  /** Percentuais de posse (0–100), cuja soma deve ser 100. */
  readonly possession: TeamStatistic
  readonly shots: TeamStatistic
  readonly shotsOnTarget: TeamStatistic
  readonly corners: TeamStatistic
  readonly fouls: TeamStatistic
  readonly yellowCards: TeamStatistic
  readonly redCards: TeamStatistic
}

export function validateMatchStatistics(statistics: MatchStatistics): void {
  for (const side of ['home', 'away'] as const) {
    const possession = statistics.possession[side]
    if (!Number.isFinite(possession) || possession < 0 || possession > 100) {
      throw new Error('Posse deve ser um percentual entre 0 e 100.')
    }
    for (const field of MATCH_COUNT_STATISTICS) {
      assertIntegerRange(statistics[field][side], 0, Number.MAX_SAFE_INTEGER, `${field}.${side}`)
    }
    if (statistics.shotsOnTarget[side] > statistics.shots[side]) {
      throw new Error('Finalizações no alvo não podem exceder as finalizações.')
    }
  }
  if (Math.abs(statistics.possession.home + statistics.possession.away - 100) > 1e-9) {
    throw new Error('Percentuais de posse devem somar 100.')
  }
}

export function createMatchStatistics(statistics: MatchStatistics): MatchStatistics {
  validateMatchStatistics(statistics)
  return Object.freeze({
    possession: Object.freeze({ ...statistics.possession }),
    shots: Object.freeze({ ...statistics.shots }),
    shotsOnTarget: Object.freeze({ ...statistics.shotsOnTarget }),
    corners: Object.freeze({ ...statistics.corners }),
    fouls: Object.freeze({ ...statistics.fouls }),
    yellowCards: Object.freeze({ ...statistics.yellowCards }),
    redCards: Object.freeze({ ...statistics.redCards }),
  })
}
