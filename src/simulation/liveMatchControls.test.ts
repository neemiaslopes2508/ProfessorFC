import { describe, expect, it } from 'vitest'
import { createId } from '../core/ids'
import type { PlayerId } from '../core/ids'
import { createLineup } from '../domain/tactics'
import type { Lineup } from '../domain/tactics'
import { createFixtureMatchInput } from '../../examples/fixtureMatch'
import { MatchSession } from './matchSession'
import { advancePrototype, getDevelopmentClubs, humanTeam, moveTeamPlayer, prototypeView, setPrototypeTactics, startPrototype } from '../application/prototypeSession'
import { captureTeamSetup } from '../application/teamSetup'
import { advancePrototypeLiveMatch, captureLiveTeamSetup, commitPrototypeLiveTeamSetup, liveTeamEditorSession, startPrototypeLiveMatch } from '../application/liveHumanMatch'

const matchId = createId('Match', 'live-controls-test')
function replace(lineup: Lineup, index: number, incoming: PlayerId): Lineup {
  const outgoing = lineup.positions[index].playerId
  return createLineup({ startingPlayers: lineup.startingPlayers.map(id => id === outgoing ? incoming : id),
    positions: lineup.positions.map(slot => slot.playerId === outgoing ? { ...slot, playerId: incoming } : slot),
    bench: lineup.bench.filter(id => id !== incoming),
  })
}

describe('Alterações da partida ao vivo', () => {
  it('registra a substituição, remove quem saiu e impede seu retorno', () => {
    const input = createFixtureMatchInput()
    const session = new MatchSession({ ...input, matchId })
    session.advance(10)
    const before = session.snapshot()
    const outgoing = before.awayLineup.positions[10].playerId
    const incoming = input.away.players.find(player => player.primaryPosition === 'ST' && before.awayLineup.bench.includes(player.id))!
    const changed = session.applyTeamSelection(input.away.club.id, replace(before.awayLineup, 10, incoming.id), before.awayTactics)
    expect(changed.awayLineup.startingPlayers).toContain(incoming.id)
    expect([...changed.awayLineup.startingPlayers, ...changed.awayLineup.bench]).not.toContain(outgoing)
    expect(changed.awaySubstitutions).toMatchObject({ used: 1, enteredPlayerIds: [incoming.id], leftPlayerIds: [outgoing] })
    expect(changed.lastEvent).toMatchObject({ minute: 10, type: 'SUBSTITUTION', clubId: input.away.club.id, playerInId: incoming.id, playerOutId: outgoing })
    expect(() => session.applyTeamSelection(input.away.club.id, replace(changed.awayLineup, 10, outgoing), changed.awayTactics)).toThrow('não pode voltar')
    const future = session.advance(10)
    expect(future.newEvents.length).toBeGreaterThan(0)
    expect(future.newEvents.every(event => event.playerId !== outgoing && event.secondaryPlayerId !== outgoing)).toBe(true)
  })

  it('aplica limites configuráveis por equipe e rejeita excesso sem consumir trocas ou alterar estado', () => {
    const input = createFixtureMatchInput()
    const session = new MatchSession({ ...input, matchId, rules: { maxSubstitutions: 1 } })
    session.advance(10)
    session.applyTeamSelection(input.home.club.id, replace(input.home.lineup, 1, input.home.lineup.bench[0]), input.home.tactics)
    const before = session.snapshot()
    expect(() => session.applyTeamSelection(input.home.club.id, replace(before.homeLineup, 2, before.homeLineup.bench[0]), before.homeTactics)).toThrow('Limite de 1')
    expect(session.snapshot()).toEqual(before)
    session.applyTeamSelection(input.away.club.id, replace(before.awayLineup, 10, before.awayLineup.bench[0]), before.awayTactics)
    expect(session.snapshot()).toMatchObject({ homeSubstitutions: { used: 1 }, awaySubstitutions: { used: 1 } })
  })

  it('confirma escalação e tática juntas sem alterar eventos e estatísticas anteriores', () => {
    let session = startPrototype(getDevelopmentClubs()[0].id)
    while (!prototypeView(session).pendingActions.length) session = advancePrototype(session)
    session = startPrototypeLiveMatch(session)
    session = advancePrototypeLiveMatch(session, 5)
    const before = session.liveMatch!
    let editing = liveTeamEditorSession(session, captureLiveTeamSetup(session))
    editing = setPrototypeTactics(editing, { ...humanTeam(editing).tactics, formation: '4-4-2', mentality: 'ATTACKING' })
    editing = moveTeamPlayer(editing, humanTeam(editing).lineup.bench.at(-1)!, 9)
    const draft = captureTeamSetup(editing)
    expect(session.liveMatch).toBe(before) // Experimentar/cancelar não executa comando no motor.
    expect(() => commitPrototypeLiveTeamSetup(session, { ...draft, tactics: { ...draft.tactics, formation: '5-3-2' } })).toThrow('incompatível')
    expect(session.liveMatch).toBe(before)
    const changed = commitPrototypeLiveTeamSetup(session, draft)
    expect(changed.liveMatch).toMatchObject({ currentMinute: 5, homeTactics: draft.tactics, homeSubstitutions: { used: 1, limit: 5 }, statistics: before.statistics, score: before.score })
    expect(changed.liveMatch!.events.slice(0, before.events.length)).toEqual(before.events)
    expect(changed.liveMatch!.homeLineup.positions).toEqual(draft.lineup.positions)
    expect(humanTeam(changed).tactics.formation).toBe('4-3-3')
  })
})
