import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import type { PlayerId } from '../../core/ids'
import { createDevelopmentFixture } from '../../data/fixtures/development'
import { loadGameData } from '../../data'
import { createPlayer } from '../players'
import type { Player } from '../players'
import { FORMATION_POSITIONS } from './formations'
import type { Lineup } from './lineup'
import type { Tactics } from './tactics'
import { prepareTeamSelection, validateTeamSelection } from './teamSelection'
import type { TeamSelectionContext } from './teamSelection'

function setup(): { lineup: Lineup; tactics: Tactics; context: TeamSelectionContext } {
  const loaded = loadGameData(createDevelopmentFixture(), 'development')
  if (!loaded.ok) throw new Error('Fixture inválida.')
  const club = loaded.repositories.clubs.getAll()[0]
  // Escolha explícita de atletas da fixture; não é seleção automática/IA.
  const startingPlayers = [0, 2, 6, 7, 4, 10, 12, 13, 16, 17, 18].map(index => club.playerIds[index])
  const lineup: Lineup = {
    startingPlayers,
    bench: club.playerIds.filter(id => !startingPlayers.includes(id)),
    positions: FORMATION_POSITIONS['4-3-3'].map((position, index) => ({ playerId: startingPlayers[index], position })),
  }
  return {
    lineup, tactics: { formation: '4-3-3', mentality: 'BALANCED', style: 'POSSESSION' },
    context: { club, players: loaded.repositories.players.getAll() },
  }
}

function replacePlayer(lineup: Lineup, group: 'startingPlayers' | 'bench', replacement: PlayerId): Lineup {
  const original = lineup[group][0]
  return {
    ...lineup,
    [group]: lineup[group].map(id => id === original ? replacement : id),
    positions: lineup.positions.map(assignment => assignment.playerId === original
      ? { ...assignment, playerId: replacement } : assignment),
  }
}

function swapAssignments(lineup: Lineup): Lineup {
  return {
    ...lineup,
    positions: lineup.positions.map((assignment, index) => index === 6
      ? { ...assignment, position: lineup.positions[8].position }
      : index === 8 ? { ...assignment, position: lineup.positions[6].position } : assignment),
  }
}

describe('Escalação e táticas contextuais', () => {
  it('prepara 11 titulares e banco da fixture sem erros ou alertas', () => {
    const { lineup, tactics, context } = setup()
    expect(validateTeamSelection(lineup, tactics, context)).toEqual({ valid: true, errors: [], warnings: [] })
    const prepared = prepareTeamSelection(lineup, tactics, context)
    if (!prepared.ok) throw new Error('Escalação válida rejeitada.')
    expect(prepared.selection.clubId).toBe(context.club.id)
    expect(prepared.selection.lineup.startingPlayers).toHaveLength(11)
    expect(prepared.selection.lineup.bench).toHaveLength(9)
    expect(prepared.selection.tactics).toEqual(tactics)
    expect(prepared.warnings).toEqual([])
  })

  it('impede jogador de outro clube tanto como titular quanto reserva', () => {
    const { lineup, tactics, context } = setup()
    const foreign = context.players.find(player => player.clubId !== context.club.id)!
    for (const group of ['startingPlayers', 'bench'] as const) {
      const prepared = prepareTeamSelection(replacePlayer(lineup, group, foreign.id), tactics, context)
      expect(prepared.ok).toBe(false)
      if (prepared.ok) throw new Error('Jogador de outro clube aceito.')
      expect(prepared.validation.errors).toContainEqual(expect.objectContaining({
        code: 'PLAYER_NOT_IN_CLUB', playerId: foreign.id, path: `lineup.${group}[0]`,
      }))
      expect(prepared).not.toHaveProperty('selection')
    }
  })

  it('impede ID inexistente entre titulares e reservas com diagnóstico específico', () => {
    const { lineup, tactics, context } = setup()
    const missing = createId('Player', 'missing-player')
    for (const group of ['startingPlayers', 'bench'] as const) {
      const result = validateTeamSelection(replacePlayer(lineup, group, missing), tactics, context)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(expect.objectContaining({ code: 'PLAYER_NOT_FOUND', playerId: missing }))
      expect(result.warnings).toEqual([])
    }
  })

  it('bloqueia lesionado, suspenso e em recuperação inclusive no banco', () => {
    const { lineup, tactics, context } = setup()
    const statuses = new Map<PlayerId, Player['status']>([
      [lineup.startingPlayers[0], 'INJURED'], [lineup.bench[0], 'SUSPENDED'], [lineup.bench[1], 'RECOVERING'],
    ])
    const players = context.players.map(player => statuses.has(player.id)
      ? createPlayer({ ...player, status: statuses.get(player.id)! }) : player)
    const prepared = prepareTeamSelection(lineup, tactics, { ...context, players })
    if (prepared.ok) throw new Error('Indisponíveis foram aceitos.')
    expect(prepared.validation.errors).toHaveLength(3)
    for (const [playerId, status] of statuses) {
      expect(prepared.validation.errors).toContainEqual(expect.objectContaining({
        code: 'PLAYER_UNAVAILABLE', playerId, message: expect.stringContaining(status),
      }))
    }
    expect(prepared.validation.warnings).toEqual([])
  })

  it('fora de posição gera alertas e ainda permite preparar a seleção', () => {
    const { lineup, tactics, context } = setup()
    const changed = swapAssignments(lineup)
    const result = validateTeamSelection(changed, tactics, context)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings.map(warning => warning.playerId)).toEqual([lineup.startingPlayers[6], lineup.startingPlayers[8]])
    expect(result.warnings.every(warning => warning.code === 'OUT_OF_POSITION')).toBe(true)
    const prepared = prepareTeamSelection(changed, tactics, context)
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) throw new Error('Alerta foi tratado como erro.')
    expect(prepared.warnings).toEqual(result.warnings)
  })

  it('aceita posição secundária sem emitir alerta de improvisação', () => {
    const { lineup, tactics, context } = setup()
    const changed = swapAssignments(lineup)
    const swappedIds = new Set([lineup.startingPlayers[6], lineup.startingPlayers[8]])
    const players = context.players.map(player => swappedIds.has(player.id)
      ? createPlayer({ ...player, secondaryPositions: [changed.positions.find(assignment => assignment.playerId === player.id)!.position] })
      : player)
    expect(validateTeamSelection(changed, tactics, { ...context, players })).toEqual({ valid: true, errors: [], warnings: [] })
  })

  it('separa impedimentos estruturais/táticos e rejeita distribuição incompatível com formação', () => {
    const { lineup, tactics, context } = setup()
    const malformedLineup = { ...lineup, bench: [lineup.startingPlayers[0]] }
    const malformedTactics = { ...tactics, mentality: 'UNKNOWN' as Tactics['mentality'] }
    const invalid = validateTeamSelection(malformedLineup, malformedTactics, context)
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map(error => error.code)).toEqual(['INVALID_LINEUP', 'INVALID_TACTICS'])
    expect(invalid.warnings).toEqual([])

    const incompatible = prepareTeamSelection(lineup, { ...tactics, formation: '5-3-2' }, context)
    if (incompatible.ok) throw new Error('Formação incompatível aceita.')
    expect(incompatible.validation.errors).toContainEqual(expect.objectContaining({ code: 'FORMATION_MISMATCH' }))
  })

  it('exige vínculo de clube consistente nos dois sentidos, sem confiar só na lista do elenco', () => {
    const { lineup, tactics, context } = setup()
    const selected = lineup.startingPlayers[0]
    const missingFromRoster = { ...context.club, playerIds: context.club.playerIds.filter(id => id !== selected) }
    expect(validateTeamSelection(lineup, tactics, { ...context, club: missingFromRoster }).errors)
      .toContainEqual(expect.objectContaining({ code: 'PLAYER_NOT_IN_CLUB', playerId: selected }))

    const players = context.players.map(player => player.id === selected ? { ...player, clubId: null } : player)
    expect(validateTeamSelection(lineup, tactics, { ...context, players }).errors)
      .toContainEqual(expect.objectContaining({ code: 'PLAYER_NOT_IN_CLUB', playerId: selected }))
  })
})
