import type { PlayerId } from '../../core/ids'
import { addGameDays } from '../../core/date'
import { assertIntegerRange } from '../../core/validation'

export type InjurySeverity = 'MINOR' | 'MODERATE' | 'SERIOUS'
export type InjuryType = 'CONTUSION' | 'MUSCLE' | 'SPRAIN' | 'KNEE'
export interface InjuryDefinition { readonly type: InjuryType; readonly label: string; readonly severity: InjurySeverity; readonly minDays: number; readonly maxDays: number }
export const INJURY_CATALOG: readonly InjuryDefinition[] = Object.freeze([
  { type: 'CONTUSION', label: 'Contusão', severity: 'MINOR', minDays: 2, maxDays: 5 },
  { type: 'MUSCLE', label: 'Problema muscular', severity: 'MODERATE', minDays: 10, maxDays: 21 },
  { type: 'SPRAIN', label: 'Entorse', severity: 'MODERATE', minDays: 7, maxDays: 18 },
  { type: 'KNEE', label: 'Lesão no joelho', severity: 'SERIOUS', minDays: 30, maxDays: 60 },
].map(item => Object.freeze(item as InjuryDefinition)))
export const MEDICAL_CONFIG = Object.freeze({ recoveryReduction: Object.freeze([0, 0.05, 0.10, 0.15, 0.20]), recoveringDays: 2 })
export interface Injury {
  readonly id: string
  readonly playerId: PlayerId
  readonly injuryType: InjuryType
  readonly severity: InjurySeverity
  readonly occurredAt: string
  /** Início da readaptação; disponibilidade plena somente em availableAt. */
  readonly expectedRecoveryDate: string
  readonly availableAt: string
  readonly status: 'INJURED' | 'RECOVERING' | 'HEALED'
  readonly baseDays: number
  readonly medicalLevel: number
}
export function medicalRecoveryReduction(level: number): number {
  assertIntegerRange(level, 1, MEDICAL_CONFIG.recoveryReduction.length, 'Nível do Departamento Médico')
  return MEDICAL_CONFIG.recoveryReduction[level - 1]
}
export function createInjury(input: { id: string; playerId: PlayerId; injuryType: InjuryType; severity: InjurySeverity; occurredAt: string; baseDays: number; medicalLevel: number }): Injury {
  assertIntegerRange(input.baseDays, 1, 3650, 'Duração da lesão')
  const days = Math.max(1, Math.ceil(input.baseDays * (1 - medicalRecoveryReduction(input.medicalLevel))))
  const expectedRecoveryDate = addGameDays(input.occurredAt, days)
  return Object.freeze({ ...input, expectedRecoveryDate, availableAt: addGameDays(expectedRecoveryDate, MEDICAL_CONFIG.recoveringDays), status: 'INJURED' })
}
