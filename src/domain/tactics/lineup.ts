import type { PlayerId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertUnique } from '../../core/validation'
import type { Position } from '../players/position'
import { validatePosition } from '../players/position'

export interface LineupPosition {
  readonly playerId: PlayerId
  readonly position: Position
}

export interface Lineup {
  readonly startingPlayers: readonly PlayerId[]
  readonly bench: readonly PlayerId[]
  readonly positions: readonly LineupPosition[]
}

/** Validação estrutural. Regras do elenco são verificadas por validateTeamSelection. */
export function validateLineup(lineup: Lineup): void {
  if (lineup.startingPlayers.length !== 11) {
    throw new Error('Escalação deve ter exatamente 11 titulares.')
  }
  const allPlayers = [...lineup.startingPlayers, ...lineup.bench]
  allPlayers.forEach(id => validateId(id, 'PlayerId'))
  assertUnique(allPlayers, 'Titulares e banco')
  if (lineup.positions.length !== 11) {
    throw new Error('Cada titular deve ter exatamente uma posição atribuída.')
  }
  const starters = new Set(lineup.startingPlayers)
  for (const assignment of lineup.positions) {
    validateId(assignment.playerId, 'PlayerId')
    validatePosition(assignment.position)
    if (!starters.has(assignment.playerId)) {
      throw new Error('Posições só podem ser atribuídas aos titulares.')
    }
  }
  assertUnique(lineup.positions.map(assignment => assignment.playerId), 'Posições atribuídas')
  if (lineup.positions.filter(assignment => assignment.position === 'GK').length !== 1) {
    throw new Error('Escalação deve ter exatamente um jogador na posição GK.')
  }
}

export function createLineup(lineup: Lineup): Lineup {
  validateLineup(lineup)
  return Object.freeze({
    startingPlayers: Object.freeze([...lineup.startingPlayers]),
    bench: Object.freeze([...lineup.bench]),
    positions: Object.freeze(lineup.positions.map(assignment => Object.freeze({ ...assignment }))),
  })
}
