import type { ClubId, PlayerId } from '../../core/ids'
import { validateId } from '../../core/ids'
import type { Money } from '../../core/money'
import { assertNonNegativeMoney, createMoneyFromCents } from '../../core/money'
import { assertDate, assertIntegerRange, assertNonEmptyString, assertOneOf, assertUnique } from '../../core/validation'
import type { PlayerAttributes } from './attributes'
import { createPlayerAttributes, validatePlayerAttributes } from './attributes'
import type { Position } from './position'
import { validatePosition } from './position'

export const PREFERRED_FEET = ['LEFT', 'RIGHT', 'BOTH'] as const
export type PreferredFoot = (typeof PREFERRED_FEET)[number]
export const PLAYER_STATUSES = ['AVAILABLE', 'INJURED', 'SUSPENDED', 'RECOVERING'] as const
export type PlayerStatus = (typeof PLAYER_STATUSES)[number]

export interface Player {
  readonly id: PlayerId
  readonly firstName: string
  readonly lastName: string
  readonly displayName: string
  readonly birthDate: string
  readonly nationality: string
  readonly preferredFoot: PreferredFoot
  readonly primaryPosition: Position
  readonly secondaryPositions: readonly Position[]
  readonly attributes: PlayerAttributes
  /** Potencial 1–100; não é garantia de overall futuro. */
  readonly potential: number
  /** Forma e condição física: 0–100. */
  readonly form: number
  readonly fitness: number
  /** null representa jogador sem clube. */
  readonly clubId: ClubId | null
  readonly marketValue: Money
  readonly status: PlayerStatus
  readonly metadata?: Readonly<Record<string, unknown>>
}

export function validatePlayer(player: Player): void {
  validateId(player.id, 'PlayerId')
  assertNonEmptyString(player.firstName, 'Nome')
  // Sobrenome pode ser vazio: nomes únicos são válidos.
  if (typeof player.lastName !== 'string') throw new Error('Sobrenome deve ser texto.')
  assertNonEmptyString(player.displayName, 'Nome exibido')
  assertNonEmptyString(player.nationality, 'Nacionalidade')
  assertDate(player.birthDate, 'Nascimento')
  assertOneOf(player.preferredFoot, PREFERRED_FEET, 'Pé dominante')
  assertOneOf(player.status, PLAYER_STATUSES, 'Estado do jogador')
  validatePosition(player.primaryPosition)
  player.secondaryPositions.forEach(validatePosition)
  assertUnique(player.secondaryPositions, 'Posições secundárias')
  if (player.secondaryPositions.includes(player.primaryPosition)) {
    throw new Error('Posição primária não deve ser repetida nas secundárias.')
  }
  validatePlayerAttributes(player.attributes)
  assertIntegerRange(player.potential, 1, 100, 'Potencial')
  assertIntegerRange(player.form, 0, 100, 'Forma')
  assertIntegerRange(player.fitness, 0, 100, 'Condição física')
  if (player.clubId !== null) validateId(player.clubId, 'ClubId')
  assertNonNegativeMoney(player.marketValue, 'Valor de mercado')
}

export function createPlayer(player: Player): Player {
  validatePlayer(player)
  return Object.freeze({
    ...player,
    attributes: createPlayerAttributes(player.attributes),
    secondaryPositions: Object.freeze([...player.secondaryPositions]),
    marketValue: createMoneyFromCents(player.marketValue.cents),
  })
}
