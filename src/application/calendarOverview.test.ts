import { expect, it } from 'vitest'
import { getDevelopmentClubs, startPrototype } from './prototypeSession'
import { getClubCalendarEvents } from './calendarOverview'

it('consulta somente eventos do clube, preserva eventos coincidentes e não altera o calendário', () => {
  const session = startPrototype(getDevelopmentClubs()[0].id)
  const game = session.game
  const april = getClubCalendarEvents(game, '2026-04-01', '2026-04-30')
  const matches = april.filter(event => event.type === 'MATCH')
  expect(matches).toHaveLength(4)
  expect(matches.every(event => event.match.homeClubId === game.humanClubId || event.match.awayClubId === game.humanClubId)).toBe(true)
  expect(matches.some(event => event.isHome)).toBe(true)
  expect(matches.some(event => !event.isHome)).toBe(true)
  expect(matches.every(event => event.opponentId !== game.humanClubId && event.match.status === 'SCHEDULED')).toBe(true)
  expect(april.some(event => event.type === 'SEASON_START')).toBe(true)
  const finalDay = getClubCalendarEvents(game, '2026-06-07', '2026-06-07')
  expect(finalDay.map(event => event.type)).toEqual(['MATCH', 'SEASON_END'])
  expect(session.game).toBe(game)
  expect(game.calendar.currentDate).toBe('2026-03-31')
  expect(april.every(event => !game.calendar.isProcessed(event.id))).toBe(true)
  expect(game.competitions[0].league.results).toHaveLength(0)
})
