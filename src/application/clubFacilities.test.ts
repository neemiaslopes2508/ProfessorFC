import { expect, it } from 'vitest'
import { advancePrototype, getDevelopmentClubs, humanTeam, startPrototype } from './prototypeSession'
import { facilityMonthlyTotals, facilityOverview, processFacilityDate, startFacilityUpgrade } from './clubFacilities'
import { developmentFinanceScenario } from './developmentFinanceScenario'
import { addGameDays } from '../core/date'

it('paga uma vez, mantém nível durante obra e conclui na data prevista sem exceder o máximo', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const facility = facilityOverview(original).find(item => item.type === 'TRAINING')!
  const started = startFacilityUpgrade(original, facility.id)
  expect(humanTeam(started).club.finances.cashBalance.cents).toBe(humanTeam(original).club.finances.cashBalance.cents - facility.next!.upgradeCostCents)
  expect(started.financialTransactions).toHaveLength(1)
  const building = facilityOverview(started).find(item => item.id === facility.id)!
  expect(building.level).toBe(1)
  expect(() => startFacilityUpgrade(started, facility.id)).toThrow('já está em obras')
  expect(() => startFacilityUpgrade(developmentFinanceScenario(original, 'critical'), facility.id)).toThrow('Caixa insuficiente')
  const completion = building.construction!.completionDate
  const before = processFacilityDate(started, addGameDays(completion, -1))
  expect(facilityOverview(before).find(item => item.id === facility.id)!.level).toBe(1)
  const after = processFacilityDate(before, completion)
  expect(facilityOverview(after).find(item => item.id === facility.id)).toMatchObject({ level: 2, status: 'AVAILABLE' })
  expect(after.facilities.find(item => item.id === facility.id)!.construction).toBeUndefined()
  expect(processFacilityDate(after, completion)).toBe(after)
  expect(after.financialTransactions.filter(item => item.type === 'FACILITY_UPGRADE')).toHaveLength(1)
  const max = { ...original, facilities: original.facilities.map(item => item.id === facility.id ? { ...item, level: 5 } : item) }
  expect(() => startFacilityUpgrade(max, facility.id)).toThrow('nível máximo')
  // Caminho curto usa o avanço real do calendário; nenhum jogo é simulado.
  const short = developmentFinanceScenario(original, 'facilities-short')
  const shop = facilityOverview(short).find(item => item.type === 'SHOP')!
  const advanced = advancePrototype(startFacilityUpgrade(short, shop.id))
  expect(advanced.game.calendar.currentDate).toBe('2026-04-01')
  expect(facilityOverview(advanced).find(item => item.type === 'SHOP')!.level).toBe(2)
})

it('cobra manutenção consolidada e credita Loja por nível uma vez por mês, conciliando caixa', () => {
  const original = startPrototype(getDevelopmentClubs()[0].id)
  const paid = processFacilityDate(original, '2026-04-01')
  expect(paid.financialTransactions).toHaveLength(12)
  expect(processFacilityDate(paid, '2026-04-01')).toBe(paid)
  const may = processFacilityDate(paid, '2026-05-01')
  expect(may.financialTransactions).toHaveLength(24)
  for (const team of may.teams) {
    const totals = facilityMonthlyTotals(original, team.club.id)
    expect(team.club.finances.cashBalance.cents).toBe(original.teams.find(item => item.club.id === team.club.id)!.club.finances.cashBalance.cents + 2 * (totals.income - totals.maintenance))
    expect(may.financialTransactions.filter(item => item.clubId === team.club.id && item.type === 'FACILITY_MAINTENANCE')).toHaveLength(2)
  }
  const short = developmentFinanceScenario(original, 'facilities-short')
  const shop = facilityOverview(short).find(item => item.type === 'SHOP')!
  const ready = processFacilityDate(startFacilityUpgrade(short, shop.id), '2026-04-01')
  expect(ready.financialTransactions.find(item => item.clubId === shop.clubId && item.type === 'MERCHANDISING')!.amount.cents).toBe(shop.next!.monthlyIncomeCents)
  expect(facilityMonthlyTotals(ready, shop.clubId).maintenance).toBe(facilityMonthlyTotals(short, shop.clubId).maintenance - shop.current.maintenanceCents + shop.next!.maintenanceCents)
})
