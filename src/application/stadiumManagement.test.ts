import { expect, it } from 'vitest'
import { advancePrototype, continuePrototypeMatch, getDevelopmentClubs, humanTeam, playPrototypeMatch, startPrototype } from './prototypeSession'
import { matchStadiumAttendance, saveStadiumPrices, stadiumOverview } from './stadiumManagement'
import { validateStadium } from '../finance/stadium'
import { settleCompetitionRevenue } from './seasonRevenue'

it('preços afetam demanda sem exceder setores; público/receita fixados são somados e pagos uma vez', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const view = stadiumOverview(original)
  const prices = view.stadium.sectors.map(sector => ({ id: sector.id, priceCents: sector.priceCents * 2 }))
  const updated = saveStadiumPrices(original, prices)
  const expensive = stadiumOverview(updated).estimate!
  expect(expensive.attendance).toBeLessThan(view.estimate!.attendance)
  expect(expensive.attendance).toBeGreaterThan(0)
  const cheap = saveStadiumPrices(original, prices.map(price => ({ ...price, priceCents: 0 })))
  expect(stadiumOverview(cheap).estimate!.attendance).toBeGreaterThan(view.estimate!.attendance)
  expect(stadiumOverview(cheap).estimate!.revenueCents).toBe(0)
  expect(() => saveStadiumPrices(original, prices.map((price, index) => ({ ...price, priceCents: index === 0 ? -1 : price.priceCents })))).toThrow('negativo')
  expect(() => validateStadium({ ...view.stadium, capacity: view.stadium.capacity + 1 })).toThrow('Soma dos setores')
  const ready = advancePrototype(advancePrototype(advancePrototype(updated)))
  const pending = playPrototypeMatch(ready)
  const id = pending.pendingMatch!.matchId
  const final = matchStadiumAttendance(pending, id, true)
  expect(final).toEqual(matchStadiumAttendance(ready, id, true))
  expect(final.attendance).toBe(final.sectors.reduce((sum, sector) => sum + sector.attendance, 0))
  expect(final.revenueCents).toBe(final.sectors.reduce((sum, sector) => sum + sector.attendance * sector.priceCents, 0))
  for (const sector of final.sectors) {
    expect(sector.attendance).toBeGreaterThanOrEqual(0)
    expect(sector.attendance).toBeLessThanOrEqual(sector.capacity)
  }
  expect(() => saveStadiumPrices(pending, prices)).toThrow('confirme')
  const confirmed = continuePrototypeMatch(pending)
  const tickets = confirmed.financialTransactions.filter(item => item.matchId === id)
  expect(tickets).toHaveLength(1)
  expect(tickets[0]).toMatchObject({ clubId: humanTeam(ready).club.id, attendance: final.attendance, amount: { cents: final.revenueCents }, stadiumAttendance: final })
  expect(humanTeam(confirmed).club.finances.cashBalance.cents).toBe(humanTeam(ready).club.finances.cashBalance.cents + final.revenueCents)
  const repriced = saveStadiumPrices(confirmed, prices.map(price => ({ ...price, priceCents: 100 })))
  expect(matchStadiumAttendance(repriced, id)).toEqual(final)
  expect(settleCompetitionRevenue(repriced)).toBe(repriced)
  expect(original.financialTransactions).toHaveLength(0)
})
