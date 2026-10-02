import { assertNonEmptyString, assertOneOf } from './validation'

declare const entityIdBrand: unique symbol

export const ENTITY_KINDS = [
  'Player', 'Club', 'Coach', 'Competition', 'CompetitionSeason', 'Match', 'Contract',
] as const

export type EntityKind = (typeof ENTITY_KINDS)[number]
export type EntityId<K extends EntityKind> = string & {
  readonly [entityIdBrand]: K
}

export type PlayerId = EntityId<'Player'>
export type ClubId = EntityId<'Club'>
export type CoachId = EntityId<'Coach'>
export type CompetitionId = EntityId<'Competition'>
export type CompetitionSeasonId = EntityId<'CompetitionSeason'>
export type MatchId = EntityId<'Match'>
export type ContractId = EntityId<'Contract'>

/** Tipagem nominal sem gerar IDs nem alterar a representação serializável. */
export function createId<K extends EntityKind>(kind: K, value: string): EntityId<K> {
  assertOneOf(kind, ENTITY_KINDS, 'Tipo de ID')
  validateId(value, `${kind}Id`)
  return value as EntityId<K>
}

export function validateId(value: string, field = 'ID'): void {
  assertNonEmptyString(value, field)
  if (value !== value.trim()) {
    throw new Error(`${field} não pode ter espaços nas extremidades.`)
  }
}
