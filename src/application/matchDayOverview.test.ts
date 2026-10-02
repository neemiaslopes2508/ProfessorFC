import { expect, it } from 'vitest'
import { getDevelopmentClubs, startPrototype, humanTeam, moveTeamPlayer } from './prototypeSession'
import { captureTeamSetup, commitTeamSetup } from './teamSetup'
import { matchDayOverview } from './matchDayOverview'
import { advanceMatchDayScene } from '../ui/components/matchDayScenes'
import type { MatchDayScene } from '../ui/components/matchDayScenes'

it('apresenta a equipe confirmada e público reproduzível sem alterar partida ou calendário', () => {
  const initial = startPrototype(getDevelopmentClubs()[0].id)
  const team = humanTeam(initial)
  const reserve = team.players.find(player => player.primaryPosition === 'ST' && team.lineup.bench.includes(player.id))!
  const draft = captureTeamSetup(moveTeamPlayer(initial, reserve.id, 10))
  const committed = commitTeamSetup(initial, draft)
  if (!committed.ok) throw new Error('Configuração válida rejeitada')
  const session = committed.session
  const fixture = session.game.competitions[0].league.fixtures.find(match => [match.homeClubId, match.awayClubId].includes(team.club.id))!
  const overview = matchDayOverview(session, fixture.id)
  const human = overview.home.team.club.id === team.club.id ? overview.home : overview.away
  expect(human.team.lineup).toEqual(draft.lineup)
  expect(human.starters.map(slot => slot.player.id)).toEqual(draft.lineup.positions.map(slot => slot.playerId))
  expect(overview.home.starters).toHaveLength(11)
  expect(overview.away.starters).toHaveLength(11)
  expect(matchDayOverview(session, fixture.id).atmosphere).toEqual(overview.atmosphere)
  expect(Number.isInteger(overview.atmosphere.attendance)).toBe(true)
  expect(overview.atmosphere.attendance).toBeGreaterThan(0)
  expect(overview.atmosphere.attendance).toBeLessThanOrEqual(overview.atmosphere.capacity)
  expect(session.game).toBe(initial.game)
  expect(session.game.calendar.currentDate).toBe('2026-03-31')
  expect(session.pendingMatch).toBeUndefined()
  expect(session.game.competitions[0].league.results).toHaveLength(0)
})

it('percorre as cenas em ordem e pular leva diretamente ao campo em qualquer etapa', () => {
  const sequence: MatchDayScene[] = ['HUB', 'ARRIVAL', 'MATCH_INTRO', 'LINEUPS', 'ENTERING_PITCH', 'MATCH']
  for (const [index, scene] of sequence.entries()) {
    expect(advanceMatchDayScene(scene, 'CONTINUE')).toBe(sequence[Math.min(index + 1, sequence.length - 1)])
    expect(advanceMatchDayScene(scene, 'SKIP')).toBe('MATCH')
  }
})
