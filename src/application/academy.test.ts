import { expect, it } from 'vitest'
import { academyAge, activeAcademyPlayers, generateAcademyIntake, promoteAcademyPlayer } from './academy'
import { getDevelopmentClubs, startPrototype } from './prototypeSession'
import { processTrainingDate } from './playerDevelopment'
import { playerOverall } from './teamOverview'

it('gera fornada determinística influenciada pela Base e promove sem duplicar o atleta', () => {
  const clubId = getDevelopmentClubs()[0].id
  const session = startPrototype(clubId, 8128)
  const date = '2026-04-01'
  const low = generateAcademyIntake(session, date)
  const repeated = generateAcademyIntake(session, date)
  expect(low.academy).toEqual(repeated.academy)
  expect(generateAcademyIntake(low, date)).toBe(low)

  const highSession = { ...session, facilities: session.facilities.map(item => item.clubId === clubId && item.type === 'YOUTH' ? { ...item, level: 5 } : item) }
  const high = generateAcademyIntake(highSession, date)
  expect(activeAcademyPlayers(high)).toHaveLength(4)
  expect(activeAcademyPlayers(low)).toHaveLength(2)
  expect(activeAcademyPlayers(high).map(({ player }) => player.potential)).not.toEqual(activeAcademyPlayers(low).map(({ player }) => player.potential))
  for (const record of activeAcademyPlayers(low)) {
    expect(academyAge(record, date)).toBeGreaterThanOrEqual(15)
    expect(academyAge(record, date)).toBeLessThanOrEqual(18)
    expect(playerOverall(record.player)).toBeLessThanOrEqual(record.player.potential)
  }

  const trained = processTrainingDate(low, date)
  const prospect = activeAcademyPlayers(trained)[0].player
  expect(trained.trainingCycles[0].changes.some(change => activeAcademyPlayers(low).some(record => record.player.id === change.playerId))).toBe(true)
  const promoted = promoteAcademyPlayer(trained, prospect.id)
  expect(activeAcademyPlayers(promoted).some(record => record.player.id === prospect.id)).toBe(false)
  const team = promoted.teams.find(item => item.club.id === clubId)!
  expect(team.players.filter(player => player.id === prospect.id)).toHaveLength(1)
  expect(team.club.playerIds.filter(id => id === prospect.id)).toHaveLength(1)
  expect(promoted.academy.find(record => record.player.id === prospect.id)).toMatchObject({ status: 'PROMOTED', promotedAt: session.game.calendar.currentDate })
})
