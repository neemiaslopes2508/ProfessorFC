import { describe, expect, it, vi } from 'vitest'
import { createFixtureMatchInput } from '../../examples/fixtureMatch'
import { createSeededRandomSource } from '../core/random'
import { createPlayer } from '../domain/players'
import { createMatch } from '../domain/matches'
import { createId } from '../core/ids'
import { calculatePlayerStrength, calculateTeamStrength } from './strength'
import { simulateMatch } from './matchEngine'

describe('MatchEngine v0.1', () => {
  it('mesma seed e mesmas entradas reproduzem toda a partida', () => {
    expect(simulateMatch(createFixtureMatchInput(2026))).toEqual(simulateMatch(createFixtureMatchInput(2026)))
  })

  it('seeds diferentes podem produzir histórias de partida diferentes', () => {
    const first = simulateMatch(createFixtureMatchInput(2026))
    const second = simulateMatch(createFixtureMatchInput(2027))
    expect(second.events).not.toEqual(first.events)
  })

  it('placar, estatísticas e sequência de ações têm a mesma fonte de verdade', () => {
    const input = createFixtureMatchInput()
    const result = simulateMatch(input)
    for (const side of ['home', 'away'] as const) {
      const clubId = input[side].club.id
      const count = (type: string) => result.events.filter(event => event.clubId === clubId && event.type === type).length
      const goals = side === 'home' ? result.score.homeGoals : result.score.awayGoals
      expect(goals).toBe(count('GOAL'))
      for (const [field, type] of [
        ['shots', 'SHOT'], ['shotsOnTarget', 'SHOT_ON_TARGET'], ['fouls', 'FOUL'],
        ['corners', 'CORNER'], ['yellowCards', 'YELLOW_CARD'], ['redCards', 'RED_CARD'],
      ] as const) expect(result.statistics[field][side]).toBe(count(type))
      expect(result.statistics.shotsOnTarget[side]).toBeLessThanOrEqual(result.statistics.shots[side])
      expect(goals).toBeLessThanOrEqual(result.statistics.shotsOnTarget[side])
      expect(result.statistics.redCards[side]).toBeGreaterThanOrEqual(0)
    }
    result.events.forEach((event, index) => {
      if (index > 0) expect(event.minute).toBeGreaterThanOrEqual(result.events[index - 1].minute)
      if (event.type === 'GOAL' || event.type === 'SAVE') expect(result.events[index - 1].type).toBe('SHOT_ON_TARGET')
      if (event.type === 'SHOT_ON_TARGET') expect(result.events[index - 1].type).toBe('SHOT')
      if (event.type === 'YELLOW_CARD') {
        expect(result.events[index - 1].type).toBe('FOUL')
        expect(result.events[index - 1].playerId).toBe(event.playerId)
      }
    })
    expect(result.statistics.possession.home + result.statistics.possession.away).toBe(100)
  })

  it('produz partida válida no domínio e eventos apenas de participantes plausíveis', () => {
    const input = createFixtureMatchInput()
    const result = simulateMatch(input)
    expect(() => createMatch({
      id: createId('Match', 'simulation-test'), competitionSeasonId: createId('CompetitionSeason', 'dev-competition-season-2026'),
      round: 1, date: '2026-01-01', homeClubId: input.home.club.id, awayClubId: input.away.club.id,
      status: 'FINISHED', homeLineup: input.home.lineup, awayLineup: input.away.lineup,
      result: result.score, events: result.events, statistics: result.statistics,
    })).not.toThrow()
    for (const event of result.events) {
      const team = event.clubId === input.home.club.id ? input.home : input.away
      expect(team.lineup.startingPlayers).toContain(event.playerId)
      const assigned = team.lineup.positions.find(position => position.playerId === event.playerId)!.position
      if (['SHOT', 'SHOT_ON_TARGET', 'GOAL', 'CORNER'].includes(event.type)) expect(assigned).not.toBe('GK')
      if (event.type === 'SAVE') expect(assigned).toBe('GK')
    }
  })

  it('executa em Node sem React, navegador ou Math.random como fonte de aleatoriedade', () => {
    const forbiddenRandom = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Uso proibido.') })
    try {
      expect(typeof window).toBe('undefined')
      expect(typeof document).toBe('undefined')
      expect(() => simulateMatch(createFixtureMatchInput())).not.toThrow()
      expect(forbiddenRandom).not.toHaveBeenCalled()
    } finally {
      forbiddenRandom.mockRestore()
    }
  })

  it('atributos relevantes, posição, forma e fitness alteram força contextual sem persistir overall', () => {
    const input = createFixtureMatchInput()
    const original = input.home.players.find(player => player.primaryPosition === 'ST')!
    const striker = createPlayer({ ...original, attributes: { ...original.attributes, finishing: 100, defending: 1 } })
    const healthy = calculatePlayerStrength(striker, 'ST')
    const tired = calculatePlayerStrength(createPlayer({ ...striker, fitness: 20, form: 20 }), 'ST')
    const improvised = calculatePlayerStrength(striker, 'CB')
    expect(tired.strength).toBeLessThan(healthy.strength)
    expect(improvised.attributeStrength).toBeLessThan(healthy.attributeStrength)
    expect(improvised.positionModifier).toBeLessThan(healthy.positionModifier)
    expect(striker).not.toHaveProperty('overall')
  })

  it('táticas e mando mostram efeitos e compensações nos setores calculados', () => {
    const { home } = createFixtureMatchInput()
    const baseline = calculateTeamStrength(home, 1)
    const attacking = calculateTeamStrength({ ...home, tactics: { ...home.tactics, mentality: 'ATTACKING' } }, 1)
    const possession = calculateTeamStrength({ ...home, tactics: { ...home.tactics, style: 'POSSESSION' } }, 1)
    expect(attacking.attack).toBeGreaterThan(baseline.attack)
    expect(attacking.defense).toBeLessThan(baseline.defense)
    expect(possession.midfield).toBeGreaterThan(baseline.midfield)
    expect(possession.attack).toBeLessThan(baseline.attack)
    const input = createFixtureMatchInput()
    const normal = simulateMatch(input)
    const neutral = simulateMatch({ ...createFixtureMatchInput(), context: { neutralVenue: true } })
    expect(normal.debug.home.attack).toBeGreaterThan(neutral.debug.home.attack)
    expect(normal.debug.away.attack).toBe(neutral.debug.away.attack)
    expect(normal.debug.home.modifiers.home).toBe(1.03)
  })

  it('configuração sem chances produz zero finalizações e gols, sem inventar estatísticas', () => {
    const input = createFixtureMatchInput()
    const result = simulateMatch({ ...input, config: { baseChanceRate: 0, foulRate: 0 } })
    expect(result.events).toEqual([])
    expect(result.score).toEqual({ homeGoals: 0, awayGoals: 0 })
    expect(result.statistics.shots).toEqual({ home: 0, away: 0 })
    expect(result.statistics.shotsOnTarget).toEqual({ home: 0, away: 0 })
    expect(result.statistics.possession.home + result.statistics.possession.away).toBe(100)
  })

  it('rejeita entradas inválidas e fontes de aleatoriedade fora do contrato', () => {
    const input = createFixtureMatchInput()
    expect(() => simulateMatch({ ...input, away: input.home })).toThrow(/ele mesmo/)
    expect(() => simulateMatch({ ...input, home: { ...input.home, players: [] } })).toThrow(/PLAYER_NOT_FOUND/)
    expect(() => simulateMatch({ ...input, config: { homeAdvantage: NaN } })).toThrow(/finito/)
    expect(() => simulateMatch({ ...input, random: { next: () => 1 } })).toThrow(/RandomSource/)
    expect(() => createSeededRandomSource(-1)).toThrow(/Seed/)
  })

  it('não altera jogadores, clubes, escalações, táticas ou contexto recebido', () => {
    const input = createFixtureMatchInput()
    const { random, ...state } = input
    const before = structuredClone(state)
    simulateMatch({ ...state, random })
    expect(state).toEqual(before)
  })
})
