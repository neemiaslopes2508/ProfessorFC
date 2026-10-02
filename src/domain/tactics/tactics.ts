import { assertOneOf } from '../../core/validation'

export const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-1-4-1', '4-3-2-1', '4-2-2-2', '4-1-2-1-2', '3-4-3', '3-4-2-1', '5-2-3', '5-4-1', '4-3-1-2', '4-5-1'] as const
export type Formation = (typeof FORMATIONS)[number]
export const MENTALITIES = ['DEFENSIVE', 'BALANCED', 'ATTACKING'] as const
export type Mentality = (typeof MENTALITIES)[number]
export const STYLES = ['POSSESSION', 'BALANCED', 'COUNTER_ATTACK', 'PRESSING'] as const
export type Style = (typeof STYLES)[number]

export interface Tactics {
  readonly formation: Formation
  readonly mentality: Mentality
  readonly style: Style
}

export function validateTactics(tactics: Tactics): void {
  assertOneOf(tactics.formation, FORMATIONS, 'Formação')
  assertOneOf(tactics.mentality, MENTALITIES, 'Mentalidade')
  assertOneOf(tactics.style, STYLES, 'Estilo')
}

export function createTactics(tactics: Tactics): Tactics {
  validateTactics(tactics)
  return Object.freeze({ ...tactics })
}
