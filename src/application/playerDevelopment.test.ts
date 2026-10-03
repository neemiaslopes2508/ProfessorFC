import { expect, it } from 'vitest'
import { getDevelopmentClubs, startPrototype } from './prototypeSession'
import { processTrainingDate } from './playerDevelopment'
import { playerOverall } from './teamOverview'
import { createPlayer } from '../domain/players'

it('processa o mês uma vez, repete com a mesma seed, respeita CT/lesão e limita atributos e potencial', () => {
  const initial = startPrototype(getDevelopmentClubs()[0].id, 451)
  const date = '2026-04-01'
  const baseline = processTrainingDate(initial, date)
  expect(processTrainingDate(baseline, date)).toBe(baseline)
  expect(processTrainingDate(initial, date)).toEqual(baseline)
  expect(baseline.trainingCycles[0].month).toBe('2026-04')

  const withCenterFive = { ...initial, facilities: initial.facilities.map(facility => facility.type === 'TRAINING' && facility.clubId === initial.game.humanClubId ? { ...facility, level: 5 } : facility) }
  const developedWithCenterFive = processTrainingDate(withCenterFive, date)
  const changes = (session: typeof baseline) => session.trainingCycles[0].changes.length
  expect(changes(developedWithCenterFive)).toBeGreaterThanOrEqual(changes(baseline))

  const injured = { ...initial, teams: initial.teams.map(team => ({ ...team, players: team.players.map(player => createPlayer({ ...player, status: 'INJURED' })) })) }
  const reduced = processTrainingDate(injured, date)
  expect(changes(reduced)).toBeLessThan(changes(baseline))
  for (const team of developedWithCenterFive.teams) for (const player of team.players) {
    for (const value of Object.values(player.attributes)) expect(value).toBeGreaterThanOrEqual(1)
    for (const value of Object.values(player.attributes)) expect(value).toBeLessThanOrEqual(100)
    expect(playerOverall(player)).toBeLessThanOrEqual(player.potential)
  }
})
