import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createLineup } from './lineup'
import type { Lineup } from './lineup'
import { createTactics, FORMATIONS, MENTALITIES, STYLES } from './tactics'
import type { Formation, Mentality, Style } from './tactics'

function lineup(): Lineup {
  const startingPlayers = Array.from({ length: 11 }, (_, index) => createId('Player', `starter-${index}`))
  return {
    startingPlayers,
    bench: [createId('Player', 'reserve-1')],
    positions: startingPlayers.map((playerId, index) => ({ playerId, position: index === 0 ? 'GK' : 'CM' })),
  }
}

describe('Lineup', () => {
  it('aceita 11 titulares, banco e exatamente um GK', () => {
    expect(createLineup(lineup()).startingPlayers).toHaveLength(11)
  })
  it.each([10, 12])('rejeita %i titulares', count => {
    const input = lineup()
    const startingPlayers = Array.from({ length: count }, (_, index) => createId('Player', `player-${index}`))
    expect(() => createLineup({ ...input, startingPlayers })).toThrow(/11 titulares/)
  })
  it('rejeita titular duplicado', () => {
    const input = lineup()
    const startingPlayers = [...input.startingPlayers]
    startingPlayers[1] = startingPlayers[0]
    expect(() => createLineup({ ...input, startingPlayers })).toThrow(/repetidos/)
  })
  it('rejeita reserva duplicado', () => {
    const input = lineup()
    expect(() => createLineup({ ...input, bench: [input.bench[0], input.bench[0]] })).toThrow(/repetidos/)
  })
  it('rejeita o mesmo jogador no banco e entre titulares', () => {
    const input = lineup()
    expect(() => createLineup({ ...input, bench: [input.startingPlayers[0]] })).toThrow(/repetidos/)
  })
  it('rejeita ausência de GK atribuído', () => {
    const input = lineup()
    const positions = input.positions.map(assignment => ({ ...assignment, position: 'CM' as const }))
    expect(() => createLineup({ ...input, positions })).toThrow(/exatamente um jogador na posição GK/)
  })
  it('rejeita dois GK atribuídos', () => {
    const input = lineup()
    const positions = input.positions.map((assignment, index) => index === 1 ? { ...assignment, position: 'GK' as const } : assignment)
    expect(() => createLineup({ ...input, positions })).toThrow(/exatamente um jogador na posição GK/)
  })
  it('rejeita titular sem posição', () => {
    const input = lineup()
    expect(() => createLineup({ ...input, positions: input.positions.slice(1) })).toThrow(/posição atribuída/)
  })
  it('rejeita duas posições para o mesmo titular', () => {
    const input = lineup()
    const positions = [...input.positions]
    positions[1] = { ...positions[1], playerId: positions[0].playerId }
    expect(() => createLineup({ ...input, positions })).toThrow(/repetidos/)
  })
  it('rejeita posição atribuída ao banco ou jogador externo', () => {
    const input = lineup()
    const positions = [...input.positions]
    positions[1] = { ...positions[1], playerId: input.bench[0] }
    expect(() => createLineup({ ...input, positions })).toThrow(/aos titulares/)
  })
  it('permite banco vazio, sem consultar clube ou disponibilidade', () => {
    expect(createLineup({ ...lineup(), bench: [] }).bench).toEqual([])
  })
  it('copia listas e associações', () => {
    const input = lineup()
    const positions = input.positions.map(assignment => ({ ...assignment }))
    const bench = [...input.bench]
    const value = createLineup({ ...input, positions, bench })
    positions[0].position = 'ST'
    bench.push(createId('Player', 'reserve-2'))
    expect(value.positions[0].position).toBe('GK')
    expect(value.bench).toHaveLength(1)
  })
})

describe('Tactics', () => {
  it.each(FORMATIONS)('aceita formação %s', formation => {
    expect(createTactics({ formation, mentality: 'BALANCED', style: 'BALANCED' }).formation).toBe(formation)
  })
  it.each(MENTALITIES)('aceita mentalidade %s', mentality => {
    expect(createTactics({ formation: '4-4-2', mentality, style: 'BALANCED' }).mentality).toBe(mentality)
  })
  it.each(STYLES)('aceita estilo %s', style => {
    expect(createTactics({ formation: '4-4-2', mentality: 'BALANCED', style }).style).toBe(style)
  })
  it('rejeita valores livres em runtime', () => {
    expect(() => createTactics({ formation: '9-1' as Formation, mentality: 'BALANCED', style: 'BALANCED' })).toThrow()
    expect(() => createTactics({ formation: '4-4-2', mentality: 'FREE' as Mentality, style: 'BALANCED' })).toThrow()
    expect(() => createTactics({ formation: '4-4-2', mentality: 'BALANCED', style: 'FREE' as Style })).toThrow()
  })
})
