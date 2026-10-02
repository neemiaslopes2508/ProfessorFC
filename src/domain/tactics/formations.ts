import type { Position } from '../players/position'
import type { Formation } from './tactics'

/** Distribuição inicial de posições; não seleciona jogadores nem calcula desempenho. */
export const FORMATION_POSITIONS: Readonly<Record<Formation, readonly Position[]>> = Object.freeze({
  '4-4-2': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'RW', 'CM', 'CM', 'LW', 'ST', 'ST'] as const),
  '4-3-3': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CM', 'RW', 'LW', 'ST'] as const),
  '4-2-3-1': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RW', 'AM', 'LW', 'ST'] as const),
  '3-5-2': Object.freeze(['GK', 'CB', 'CB', 'CB', 'RB', 'DM', 'CM', 'AM', 'LB', 'ST', 'ST'] as const),
  '5-3-2': Object.freeze(['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CM', 'ST', 'ST'] as const),
  '4-1-4-1': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'RW', 'CM', 'CM', 'LW', 'ST'] as const),
  '4-3-2-1': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CM', 'AM', 'AM', 'ST'] as const),
  '4-2-2-2': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'DM', 'AM', 'AM', 'ST', 'ST'] as const),
  '4-1-2-1-2': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST'] as const),
  '3-4-3': Object.freeze(['GK', 'CB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LB', 'RW', 'LW', 'ST'] as const),
  '3-4-2-1': Object.freeze(['GK', 'CB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LB', 'AM', 'AM', 'ST'] as const),
  '5-2-3': Object.freeze(['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'CM', 'CM', 'RW', 'LW', 'ST'] as const),
  '5-4-1': Object.freeze(['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'RW', 'CM', 'CM', 'LW', 'ST'] as const),
  '4-3-1-2': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST'] as const),
  '4-5-1': Object.freeze(['GK', 'RB', 'CB', 'CB', 'LB', 'RW', 'CM', 'DM', 'CM', 'LW', 'ST'] as const),
})
