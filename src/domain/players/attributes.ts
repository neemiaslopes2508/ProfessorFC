import { assertIntegerRange } from '../../core/validation'

export const ATTRIBUTE_NAMES = [
  'finishing', 'passing', 'technique', 'defending', 'pace', 'physical', 'stamina', 'decision',
] as const

export type PlayerAttributes = Readonly<Record<(typeof ATTRIBUTE_NAMES)[number], number>>

export function validatePlayerAttributes(attributes: PlayerAttributes): void {
  for (const attribute of ATTRIBUTE_NAMES) {
    assertIntegerRange(attributes[attribute], 1, 100, attribute)
  }
}

export function createPlayerAttributes(attributes: PlayerAttributes): PlayerAttributes {
  validatePlayerAttributes(attributes)
  return Object.freeze({ ...attributes })
}
