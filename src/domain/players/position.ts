import { assertOneOf } from '../../core/validation'

export const POSITIONS = ['GK', 'RB', 'LB', 'CB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST'] as const
export type Position = (typeof POSITIONS)[number]

export function validatePosition(position: Position): void {
  assertOneOf(position, POSITIONS, 'Posição')
}
