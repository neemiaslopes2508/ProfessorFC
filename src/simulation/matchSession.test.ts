import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { createId } from '../core/ids'
import { createFixtureMatchInput } from '../../examples/fixtureMatch'
import { MatchSession, simulateMatch } from './index'
import { summarizeEvents } from './events'
import { getDevelopmentClubs, startPrototype, advancePrototype, humanTeam, setPrototypeTactics, continuePrototypeMatch, playPrototypeMatch, prototypeView } from '../application/prototypeSession'
import { captureTeamSetup, commitTeamSetup } from '../application/teamSetup'
import { startPrototypeLiveMatch, advancePrototypeLiveMatch, advancePrototypeToNextMatchEvent, startPrototypeSecondHalf, updatePrototypeLiveTactics } from '../application/liveHumanMatch'

const matchId = createId('Match', 'session-test')
function makeSession() { return new MatchSession({ ...createFixtureMatchInput(2026), matchId }) }

describe('MatchSession incremental', () => {
  it('reproduz o motor anterior e mantém determinismo independentemente do tamanho dos passos', () => {
    const stepped = makeSession()
    const batched = makeSession()
    while (stepped.snapshot().canAdvance) stepped.advance(1)
    stepped.startSecondHalf()
    while (stepped.snapshot().canAdvance) stepped.advance(5)
    batched.advance(90)
    batched.startSecondHalf()
    batched.advance(90)
    const result = simulateMatch(createFixtureMatchInput(2026))
    expect(stepped.toResult()).toEqual(batched.toResult())
    expect(stepped.toResult()).toEqual(result)
    // Capturado antes da refatoração: protege também a ordem dos sorteios e os eventos.
    expect(createHash('sha256').update(JSON.stringify(result)).digest('hex')).toBe('5a1b93607e42546b5a25c9957e0b6bfc8aca6fd39d4cebb2a2a2d03ced4138f5')
    function withIntervention() {
      const session = makeSession()
      session.advance(30)
      session.applyTactics(session.snapshot().homeClubId, { ...session.snapshot().homeTactics, mentality: 'DEFENSIVE' })
      session.advance(15)
      session.startSecondHalf()
      session.advance(45)
      return session.toResult()
    }
    expect(withIntervention()).toEqual(withIntervention())
  })

  it('para obrigatoriamente no intervalo e bloqueia início duplicado, regressão e avanços após o fim', () => {
    const input = createFixtureMatchInput(2026)
    const next = vi.fn(input.random.next)
    const session = new MatchSession({ ...input, matchId, random: { next } })
    expect(() => session.startSecondHalf()).toThrow('intervalo')
    expect(() => session.toResult()).toThrow('FULL_TIME')
    expect(() => session.advance(-1)).toThrow()
    expect(() => session.advance(1.5)).toThrow()
    const half = session.advance(100).snapshot
    expect(half).toMatchObject({ currentMinute: 45, phase: 'HALF_TIME', canAdvance: false })
    const calls = next.mock.calls.length
    expect(session.advance(100)).toEqual({ snapshot: half, newEvents: [] })
    expect(next).toHaveBeenCalledTimes(calls)
    expect(session.startSecondHalf()).toMatchObject({ currentMinute: 45, phase: 'SECOND_HALF', score: half.score, statistics: half.statistics, events: half.events })
    expect(() => session.startSecondHalf()).toThrow('intervalo')
    const full = session.advance(100).snapshot
    expect(full).toMatchObject({ currentMinute: 90, phase: 'FULL_TIME', status: 'FINISHED', canAdvance: false, canChangeTactics: false })
    const finalCalls = next.mock.calls.length
    expect(session.advance(5)).toEqual({ snapshot: full, newEvents: [] })
    expect(next).toHaveBeenCalledTimes(finalCalls)
    expect(() => session.applyTactics(input.home.club.id, input.home.tactics)).toThrow('terminou')
  })

  it('expõe snapshots imutáveis e estatísticas somente dos minutos processados, sem duplicar eventos', () => {
    const input = createFixtureMatchInput(2026)
    const next = vi.fn(input.random.next)
    const session = new MatchSession({ ...input, matchId, random: { next }, config: { foulRate: 1, cardRate: 1 } })
    const zero = session.snapshot()
    expect(next).not.toHaveBeenCalled()
    expect(zero).toMatchObject({ currentMinute: 0, phase: 'PRE_MATCH', events: [], score: { homeGoals: 0, awayGoals: 0 }, statistics: { shots: { home: 0, away: 0 }, possession: { home: 50, away: 50 } } })
    const first = session.advance(1)
    const later = session.advance(5)
    expect(first.newEvents.length).toBeGreaterThan(0)
    expect(first.newEvents.every(event => event.minute === 1)).toBe(true)
    expect(later.newEvents.every(event => event.minute > 1 && event.minute <= 6)).toBe(true)
    expect(later.snapshot.events).toEqual([...first.newEvents, ...later.newEvents])
    expect(later.snapshot).toMatchObject(summarizeEvents(later.snapshot.events, input.home.club.id, later.snapshot.statistics.possession.home))
    expect(first.snapshot.events).toEqual(first.newEvents)
    expect(zero.events).toEqual([])
    expect(() => (first.snapshot.events as unknown[]).push({})).toThrow()
    expect(() => Object.assign(first.snapshot.statistics.fouls, { home: 999 })).toThrow()
    expect(() => Object.assign(first.snapshot.homeLineup.positions[0], { playerId: 'changed' })).toThrow()
    expect(session.advance(0).newEvents).toEqual([])
  })

  it('coordena táticas ao vivo sem alterar o passado e confirma o resultado somente uma vez na aplicação', () => {
    let session = startPrototype(getDevelopmentClubs()[0].id)
    session = advancePrototype(advancePrototype(session))
    const before = session
    session = startPrototypeLiveMatch(session)
    expect(session.liveMatch).toMatchObject({ currentMinute: 0, events: [] })
    expect(startPrototypeLiveMatch(session)).toBe(session)
    expect(() => advancePrototype(session)).toThrow('andamento')
    expect(() => playPrototypeMatch(session)).toThrow('andamento')
    expect(() => setPrototypeTactics(session, humanTeam(session).tactics)).toThrow('partida')
    expect(() => commitTeamSetup(session, captureTeamSetup(session))).toThrow('partida')
    session = advancePrototypeToNextMatchEvent(session)
    expect(session.liveMatch!.events.length).toBeGreaterThan(0)
    const stale = session
    session = advancePrototypeLiveMatch(session, 100)
    const half = session.liveMatch!
    const tactics = { ...half.homeTactics, mentality: 'ATTACKING' as const, style: 'PRESSING' as const }
    expect(() => advancePrototypeLiveMatch(stale, 1)).toThrow('snapshot')
    expect(() => updatePrototypeLiveTactics(session, { ...tactics, formation: '5-3-2' })).toThrow('incompatível')
    session = updatePrototypeLiveTactics(session, tactics)
    expect(session.liveMatch).toMatchObject({ events: half.events, score: half.score, statistics: half.statistics, currentMinute: 45, homeTactics: tactics })
    expect(half.homeTactics.mentality).toBe('BALANCED')
    expect(humanTeam(session).tactics).toEqual(humanTeam(before).tactics)
    session = startPrototypeSecondHalf(session)
    session = advancePrototypeLiveMatch(session, 100)
    expect(session.liveMatch).toBeUndefined()
    expect(session.game).toBe(before.game)
    expect(prototypeView(session).humanStanding.played).toBe(0)
    const result = session.pendingMatch!.result
    expect(result.events.slice(0, half.events.length)).toEqual(half.events)
    expect(result.events.slice(half.events.length).every(event => event.minute > 45)).toBe(true)
    expect(result.debug.home.modifiers.mentality.attack).toBeGreaterThan(1)
    const confirmed = continuePrototypeMatch(session)
    expect(prototypeView(confirmed).humanStanding.played).toBe(1)
    expect(continuePrototypeMatch(confirmed)).toBe(confirmed)
    expect(confirmed.lastMatch!.result).toBe(result)
  })
})
