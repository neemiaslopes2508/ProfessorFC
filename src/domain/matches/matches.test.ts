import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createMatch, MATCH_STATUSES } from './match'
import type { Match } from './match'
import { createMatchResult } from './result'
import { createMatchEvent, MATCH_EVENT_TYPES } from './event'
import { createMatchStatistics, MATCH_COUNT_STATISTICS } from './statistics'
import type { MatchStatistics } from './statistics'

function match(): Match {
  return {
    id: createId('Match', 'test-match'), competitionSeasonId: createId('CompetitionSeason', 'test-season'),
    round: 1, date: '2026-01-01', homeClubId: createId('Club', 'home'), awayClubId: createId('Club', 'away'),
    status: 'SCHEDULED', events: [],
  }
}
function statistics(): MatchStatistics {
  return {
    possession: { home: 55, away: 45 }, shots: { home: 10, away: 8 },
    shotsOnTarget: { home: 5, away: 3 }, corners: { home: 4, away: 2 },
    fouls: { home: 10, away: 8 }, yellowCards: { home: 2, away: 1 }, redCards: { home: 0, away: 0 },
  }
}

describe('Match', () => {
  it('aceita clubes diferentes sem calcular resultado', () => {
    const value = createMatch(match())
    expect(value.homeClubId).not.toBe(value.awayClubId)
    expect(value.result).toBeUndefined()
  })
  it('rejeita clube contra ele mesmo', () => {
    const input = match()
    expect(() => createMatch({ ...input, awayClubId: input.homeClubId })).toThrow(/ele mesmo/)
  })
  it.each(MATCH_STATUSES)('representa estado %s', status => {
    const result = status === 'FINISHED' ? { homeGoals: 0, awayGoals: 0 } : undefined
    expect(createMatch({ ...match(), status, result }).status).toBe(status)
  })
  it('rejeita partida finalizada sem resultado', () => {
    expect(() => createMatch({ ...match(), status: 'FINISHED' })).toThrow(/precisa possuir resultado/)
  })
  it('rejeita evento de clube que não participa da partida', () => {
    const event = { minute: 0, type: 'GOAL' as const, clubId: createId('Club', 'outsider') }
    expect(() => createMatch({ ...match(), events: [event] })).toThrow(/um dos clubes/)
  })
  it('copia placar e eventos recebidos sem simulá-los', () => {
    const result = { homeGoals: 1, awayGoals: 0 }
    const events = [{ minute: 10, type: 'GOAL' as const, clubId: match().homeClubId }]
    const value = createMatch({ ...match(), status: 'FINISHED', result, events, statistics: statistics() })
    result.homeGoals = -1
    events[0].minute = -1
    expect(value.result?.homeGoals).toBe(1)
    expect(value.events[0].minute).toBe(10)
  })
  it.each([0, -1, NaN, 1.5])('rejeita rodada %s', round => {
    expect(() => createMatch({ ...match(), round })).toThrow()
  })
})

describe('MatchResult', () => {
  it('representa um placar inteiro não negativo', () => {
    expect(createMatchResult({ homeGoals: 2, awayGoals: 1 })).toEqual({ homeGoals: 2, awayGoals: 1 })
  })
  it.each([-1, 0.5, NaN, Infinity])('rejeita contagem de gols %s', value => {
    expect(() => createMatchResult({ homeGoals: value, awayGoals: 0 })).toThrow()
    expect(() => createMatchResult({ homeGoals: 0, awayGoals: value })).toThrow()
  })
})

describe('MatchEvent', () => {
  it.each(MATCH_EVENT_TYPES)('representa %s sem produzir eventos', type => {
    expect(createMatchEvent({ minute: 0, type, clubId: match().homeClubId }).type).toBe(type)
  })
  it('aceita acréscimos e jogadores opcionais', () => {
    expect(createMatchEvent({ minute: 120, type: 'SUBSTITUTION', clubId: match().homeClubId, playerId: createId('Player', 'p-1'), secondaryPlayerId: createId('Player', 'p-2') }).minute).toBe(120)
  })
  it.each([-1, NaN, Infinity, 0.5])('rejeita minuto %s', minute => {
    expect(() => createMatchEvent({ minute, type: 'GOAL', clubId: match().homeClubId })).toThrow()
  })
})

describe('MatchStatistics', () => {
  it('aceita estatísticas coerentes e posse decimal', () => {
    const input = { ...statistics(), possession: { home: 55.5, away: 44.5 } }
    expect(createMatchStatistics(input)).toEqual(input)
  })
  it.each(MATCH_COUNT_STATISTICS)('valida contagens de %s', field => {
    for (const value of [-1, 0.5, NaN, Infinity]) {
      expect(() => createMatchStatistics({ ...statistics(), [field]: { home: value, away: 0 } })).toThrow()
    }
  })
  it('rejeita finalizações no alvo maiores que as finalizações', () => {
    expect(() => createMatchStatistics({ ...statistics(), shotsOnTarget: { home: 11, away: 3 } })).toThrow()
  })
  it.each([{ home: 50, away: 40 }, { home: -1, away: 101 }, { home: NaN, away: 50 }])('rejeita posse incoerente %j', possession => {
    expect(() => createMatchStatistics({ ...statistics(), possession })).toThrow()
  })
})
