import type { ClubId, CoachId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertIntegerRange, assertNonEmptyString } from '../../core/validation'

export interface Coach {
  readonly id: CoachId
  readonly name: string
  readonly nationality: string
  readonly reputation: number
  /** Pontos inteiros não negativos; evolução ainda não implementada. */
  readonly experience: number
  readonly currentClubId?: ClubId
  readonly humanControlled: boolean
}

export function validateCoach(coach: Coach): void {
  validateId(coach.id, 'CoachId')
  assertNonEmptyString(coach.name, 'Nome do treinador')
  assertNonEmptyString(coach.nationality, 'Nacionalidade')
  assertIntegerRange(coach.reputation, 0, 100, 'Reputação do treinador')
  assertIntegerRange(coach.experience, 0, Number.MAX_SAFE_INTEGER, 'Experiência')
  if (coach.currentClubId !== undefined) validateId(coach.currentClubId, 'ClubId')
  if (typeof coach.humanControlled !== 'boolean') {
    throw new Error('Controle humano deve ser booleano.')
  }
}

export function createCoach(coach: Coach): Coach {
  validateCoach(coach)
  return Object.freeze({ ...coach })
}
