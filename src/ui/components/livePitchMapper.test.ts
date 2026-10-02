import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createFixtureMatchInput } from '../../../examples/fixtureMatch'
import { MatchSession } from '../../simulation'
import { mapPitchEvents, pitchPlayers } from './livePitchMapper'

describe('Mapper visual da partida', () => {
  it('representa chute e gol em ordem, com reinício, sem alterar eventos ou consumir RNG', () => {
    const input = createFixtureMatchInput()
    const snapshot = new MatchSession({ ...input, matchId: createId('Match', 'visual-test') }).snapshot()
    const players = pitchPlayers(snapshot, input.home, input.away)
    const actor = snapshot.homeLineup.positions[10].playerId
    const events = [
      { type: 'SHOT' as const, minute: 12, clubId: input.home.club.id, playerId: actor },
      { type: 'SHOT_ON_TARGET' as const, minute: 12, clubId: input.home.club.id, playerId: actor },
      { type: 'GOAL' as const, minute: 12, clubId: input.home.club.id, playerId: actor },
    ]
    const frames = mapPitchEvents(snapshot, players, events)
    expect(frames.filter(frame => frame.event).map(frame => frame.event!.type)).toEqual(['SHOT', 'SHOT', 'SHOT_ON_TARGET', 'GOAL', 'GOAL'])
    expect(frames.find(frame => frame.phase === 'GOAL')!.ball).toEqual({ x: 931, y: 310 })
    expect(frames.find(frame => frame.phase === 'RESET')!.ball).toEqual({ x: 500, y: 310 })
    expect(snapshot.events).toEqual([])
    expect(mapPitchEvents(snapshot, players, events)).toEqual(frames)
    expect(input.random.next()).toBe(createFixtureMatchInput().random.next())
  })

  it('usa a lineup e a formação atuais, removendo substituído e distinguindo defesa de gol', () => {
    const input = createFixtureMatchInput()
    const session = new MatchSession({ ...input, matchId: createId('Match', 'visual-change') })
    const initial = session.snapshot()
    const outgoing = initial.homeLineup.positions[10].playerId
    const incoming = initial.homeLineup.bench.at(-1)!
    const lineup = { startingPlayers: initial.homeLineup.startingPlayers.map(id => id === outgoing ? incoming : id), bench: initial.homeLineup.bench.filter(id => id !== incoming), positions: initial.homeLineup.positions.map(slot => ({ ...slot, playerId: slot.playerId === outgoing ? incoming : slot.playerId })) }
    const snapshot = session.applyTeamSelection(input.home.club.id, lineup, input.home.tactics)
    const players = pitchPlayers(snapshot, input.home, input.away)
    expect(players).toHaveLength(22)
    expect(players.some(player => player.id === outgoing)).toBe(false)
    expect(players.some(player => player.id === incoming)).toBe(true)
    const keeper = players.find(player => player.clubId === input.away.club.id && player.goalkeeper)!
    const frames = mapPitchEvents(snapshot, players, [{ type: 'SAVE', minute: 12, clubId: input.away.club.id, playerId: keeper.id }])
    expect(frames.map(frame => frame.phase)).toEqual(['SAVE', 'ORGANIZATION'])
    expect(frames[0].ball.x).toBeLessThan(920)
    const changedFormation = pitchPlayers({ ...snapshot, homeTactics: { ...snapshot.homeTactics, formation: '4-4-2' } }, input.home, input.away)
    expect(changedFormation.map(player => [player.x, player.y])).not.toEqual(players.map(player => [player.x, player.y]))
  })
})
