import type { Player, PlayerAttributes, Position } from '../domain/players'
import type { PlayerId } from '../core/ids'
import type { SimulationTeam } from './types'
import {
  ENGINE_FACTORS, FORMATION_MODIFIERS, MENTALITY_MODIFIERS, STYLE_MODIFIERS,
  POSITION_ATTRIBUTE_WEIGHTS, POSITION_CONTRIBUTIONS,
} from './config'
import type { TacticalModifiers } from './config'

export interface PlayerStrength {
  readonly playerId: PlayerId
  readonly position: Position
  readonly attributeStrength: number
  readonly fitnessModifier: number
  readonly formModifier: number
  readonly positionModifier: number
  readonly strength: number
}

export interface TeamStrength {
  readonly defense: number
  readonly midfield: number
  readonly attack: number
  readonly overall: number
  readonly goalkeeper: PlayerStrength
  readonly players: readonly PlayerStrength[]
  readonly base: { readonly defense: number; readonly midfield: number; readonly attack: number }
  readonly modifiers: {
    readonly formation: TacticalModifiers
    readonly mentality: TacticalModifiers
    readonly style: TacticalModifiers
    readonly home: number
  }
}

export function calculatePlayerStrength(player: Player, position: Position): PlayerStrength {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[position]
  let attributeStrength = 0
  for (const [attribute, weight] of Object.entries(weights)) {
    attributeStrength += player.attributes[attribute as keyof PlayerAttributes] * weight
  }
  const fitnessModifier = ENGINE_FACTORS.fitnessFloor + ENGINE_FACTORS.fitnessInfluence * player.fitness / ENGINE_FACTORS.attributeScale
  const formModifier = ENGINE_FACTORS.formFloor + ENGINE_FACTORS.formInfluence * player.form / ENGINE_FACTORS.attributeScale
  const positionModifier = player.primaryPosition === position || player.secondaryPositions.includes(position)
    ? 1 : ENGINE_FACTORS.outOfPosition
  return Object.freeze({
    playerId: player.id, position, attributeStrength, fitnessModifier, formModifier, positionModifier,
    strength: attributeStrength * fitnessModifier * formModifier * positionModifier,
  })
}

/** Usa somente titulares. Banco não acrescenta força e não participa de ações. */
export function calculateTeamStrength(team: SimulationTeam, homeModifier: number): TeamStrength {
  const byId = new Map(team.players.map(player => [player.id, player]))
  const players = team.lineup.positions.map(assignment => {
    const player = byId.get(assignment.playerId)
    if (!player) throw new Error(`Jogador ausente: ${assignment.playerId}.`)
    return calculatePlayerStrength(player, assignment.position)
  })
  const formation = FORMATION_MODIFIERS[team.tactics.formation]
  const mentality = MENTALITY_MODIFIERS[team.tactics.mentality]
  const style = STYLE_MODIFIERS[team.tactics.style]
  function sector(name: 'defense' | 'midfield' | 'attack'): number {
    const denominator = players.reduce((sum, player) => sum + POSITION_CONTRIBUTIONS[player.position][name], 0)
    return players.reduce((sum, player) => sum + player.strength * POSITION_CONTRIBUTIONS[player.position][name], 0) / denominator
  }
  const base = Object.freeze({ defense: sector('defense'), midfield: sector('midfield'), attack: sector('attack') })
  const defense = base.defense * formation.defense * mentality.defense * style.defense * homeModifier
  const midfield = base.midfield * formation.midfield * mentality.midfield * style.midfield * homeModifier
  const attack = base.attack * formation.attack * mentality.attack * style.attack * homeModifier
  const goalkeeper = players.find(player => player.position === 'GK')
  if (!goalkeeper) throw new Error('Goleiro ausente.')
  return Object.freeze({
    defense, midfield, attack, overall: (defense + midfield + attack) / 3,
    goalkeeper, players: Object.freeze(players), base,
    modifiers: Object.freeze({ formation, mentality, style, home: homeModifier }),
  })
}
