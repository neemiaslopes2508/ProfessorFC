import { expect, it } from 'vitest'
import { developmentFinanceScenario } from './developmentFinanceScenario'
import { advancePrototype, getDevelopmentClubs, humanTeam, startPrototype } from './prototypeSession'
import { facilityMonthlyTotals, processFacilityDate } from './clubFacilities'
import { stadiumExpansionOptions, stadiumOverview, startStadiumSectorExpansion } from './stadiumManagement'
import { validateStadium } from '../finance/stadium'

it('expande setor via obra, atualiza capacidade, bilheteria e manutenção uma única vez', () => {
  const original = developmentFinanceScenario(startPrototype(getDevelopmentClubs()[0].id, 7401), 'stadium-expansion-short')
  const before = stadiumOverview(original)
  const option = stadiumExpansionOptions(original, 'popular')
  expect(option).toMatchObject({ targetCapacity: 12000, costCents: 200000000, days: 1, maintenanceCents: 1000000 })
  const started = startStadiumSectorExpansion(original, 'popular')
  expect(humanTeam(started).club.finances.cashBalance.cents).toBe(humanTeam(original).club.finances.cashBalance.cents - option.costCents!)
  expect(started.financialTransactions.filter(item => item.type === 'STADIUM_EXPANSION')).toHaveLength(1)
  expect(started.stadiums[0].capacity).toBe(before.stadium.capacity)
  expect(started.stadiums[0].sectors[0].construction?.targetCapacity).toBe(12000)
  expect(() => startStadiumSectorExpansion(started, 'popular')).toThrow('já está em obras')

  const ready = advancePrototype(started)
  const stadium = ready.stadiums.find(item => item.clubId === original.game.humanClubId)!
  expect(ready.game.calendar.currentDate).toBe('2026-04-01')
  expect(stadium.capacity).toBe(before.stadium.capacity + 2000)
  expect(stadium.sectors.reduce((sum, sector) => sum + sector.capacity, 0)).toBe(stadium.capacity)
  expect(stadium.sectors[0].construction).toBeUndefined()
  expect(facilityMonthlyTotals(ready, stadium.clubId).stadiumMaintenance).toBe(1000000)
  expect(ready.financialTransactions.filter(item => item.type === 'STADIUM_MAINTENANCE')).toHaveLength(1)
  expect(processFacilityDate(ready, ready.game.calendar.currentDate).financialTransactions).toHaveLength(ready.financialTransactions.length)
  validateStadium(stadium)
  const after = stadiumOverview(ready)
  expect(after.estimate!.capacity).toBe(stadium.capacity)
  expect(after.estimate!.attendance).toBeGreaterThan(before.estimate!.attendance)
  expect(after.estimate!.revenueCents).toBeGreaterThan(before.estimate!.revenueCents)
  expect(ready.financialTransactions.filter(item => item.type === 'STADIUM_EXPANSION')).toHaveLength(1)
})
