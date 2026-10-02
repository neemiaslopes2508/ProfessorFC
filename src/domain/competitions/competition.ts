import type { CompetitionId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertIntegerRange, assertNonEmptyString, assertOneOf } from '../../core/validation'

export const COMPETITION_TYPES = ['LEAGUE', 'KNOCKOUT', 'GROUP_AND_KNOCKOUT'] as const
export type CompetitionType = (typeof COMPETITION_TYPES)[number]

/** Metadados mínimos; não executa regras ou gera jogos. */
export interface CompetitionFormat {
  readonly legs: 1 | 2
  readonly groupCount?: number
}

export interface Competition {
  readonly id: CompetitionId
  readonly name: string
  readonly country: string
  readonly type: CompetitionType
  readonly format: CompetitionFormat
}

export function validateCompetition(competition: Competition): void {
  validateId(competition.id, 'CompetitionId')
  assertNonEmptyString(competition.name, 'Nome da competição')
  assertNonEmptyString(competition.country, 'País')
  assertOneOf(competition.type, COMPETITION_TYPES, 'Tipo de competição')
  assertOneOf(competition.format.legs, [1, 2], 'Número de confrontos por par')
  if (competition.format.groupCount !== undefined) {
    assertIntegerRange(competition.format.groupCount, 1, Number.MAX_SAFE_INTEGER, 'Quantidade de grupos')
  }
}

export function createCompetition(competition: Competition): Competition {
  validateCompetition(competition)
  return Object.freeze({ ...competition, format: Object.freeze({ ...competition.format }) })
}
