import { MEDICAL_CONFIG, medicalRecoveryReduction } from '../domain/players/injury'
import { TRAINING_CONFIG } from '../domain/players/development'
import type { PrototypeSession } from './prototypeSession'
import type { ClubId } from '../core/ids'
import { createClub } from '../domain/clubs'
import { addGameDays } from '../core/date'
import { assertDate, assertIntegerRange } from '../core/validation'
import { addMoney, subtractMoney, createMoneyFromCents } from '../core/money'
import { paymentDates } from './contractLifecycle'
import type { FinanceTransaction } from '../finance/types'
import { validateStadium } from '../finance/stadium'

export function facilityOverview(session: PrototypeSession, clubId = session.game.humanClubId) {
  return session.facilities.filter(item => item.clubId === clubId).map(facility => {
    const definition = session.facilityConfig.definitions.find(item => item.type === facility.type)
    if (!definition) throw new Error('Configuração de instalação inexistente.')
    assertIntegerRange(facility.level, 1, definition.levels.length, 'Nível da instalação')
    const benefit = facility.type === 'MEDICAL'
      ? 'Recuperação mais eficiente. Redução atual do tempo de lesão: ' + Math.round(medicalRecoveryReduction(facility.level) * 100) + '%. Readaptação final: ' + MEDICAL_CONFIG.recoveringDays + ' dias. Não elimina o risco de lesões.'
      : facility.type === 'TRAINING'
        ? `Aumenta em até ${Math.round((facility.level - 1) * TRAINING_CONFIG.trainingCenterChancePerLevel * 100)}% a chance mensal de evolução.`
        : facility.type === 'YOUTH'
          ? `Captação apresenta ${1 + Math.floor((facility.level + 1) / 2)} jovens por janela e melhora gradualmente a chance de bom potencial e desenvolvimento mensal.`
        : facility.type === 'STADIUM'
          ? 'Cada nível estrutural libera expansões melhores nos setores. A capacidade só aumenta quando uma obra é concluída.'
        : definition.benefit
    return { ...facility, ...definition, benefit, maxLevel: definition.levels.length, current: definition.levels[facility.level - 1], next: definition.levels[facility.level], status: facility.construction ? 'BUILDING' : facility.level === definition.levels.length ? 'MAX_LEVEL' : 'AVAILABLE' }
  })
}
export function facilityMonthlyTotals(session: PrototypeSession, clubId: ClubId) {
  const facilities = facilityOverview(session, clubId)
  const baseMaintenance = facilities.reduce((sum, item) => sum + item.current.maintenanceCents, 0)
  const stadiumMaintenance = session.stadiums.filter(stadium => stadium.clubId === clubId).flatMap(stadium => stadium.sectors).reduce((sum, sector) => sum + (sector.maintenanceCents ?? 0), 0)
  return { maintenance: createMoneyFromCents(baseMaintenance + stadiumMaintenance).cents, baseMaintenance: createMoneyFromCents(baseMaintenance).cents, stadiumMaintenance: createMoneyFromCents(stadiumMaintenance).cents, income: createMoneyFromCents(facilities.reduce((sum, item) => sum + item.current.monthlyIncomeCents, 0)).cents }
}
function transact(session: PrototypeSession, transaction: FinanceTransaction, expense: boolean): PrototypeSession {
  if (session.financialTransactions.some(item => item.id === transaction.id)) return session
  return Object.freeze({ ...session, teams: Object.freeze(session.teams.map(team => team.club.id === transaction.clubId ? Object.freeze({ ...team, club: createClub({ ...team.club, finances: { ...team.club.finances, cashBalance: expense ? subtractMoney(team.club.finances.cashBalance, transaction.amount) : addMoney(team.club.finances.cashBalance, transaction.amount) } }) }) : team)), financialTransactions: Object.freeze([...session.financialTransactions, Object.freeze(transaction)]) })
}
export function startFacilityUpgrade(session: PrototypeSession, facilityId: string): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) throw new Error('Conclua e confirme a partida antes de iniciar uma obra.')
  const view = facilityOverview(session).find(item => item.id === facilityId)
  if (!view) throw new Error('Instalação não pertence ao seu clube.')
  if (view.construction) throw new Error('Instalação já está em obras.')
  if (!view.next) throw new Error('Instalação já atingiu o nível máximo.')
  const cost = createMoneyFromCents(view.next.upgradeCostCents)
  assertIntegerRange(cost.cents, 0, Number.MAX_SAFE_INTEGER, 'Custo da obra')
  assertIntegerRange(view.next.upgradeDays, 1, Number.MAX_SAFE_INTEGER, 'Prazo da obra')
  const club = session.teams.find(team => team.club.id === view.clubId)!.club
  if (club.finances.cashBalance.cents < cost.cents) throw new Error('Caixa insuficiente para iniciar a melhoria.')
  const date = session.game.calendar.currentDate
  const construction = Object.freeze({ startedAt: date, completionDate: addGameDays(date, view.next.upgradeDays), targetLevel: view.level + 1 })
  const next = transact(session, { id: `facility-upgrade-${view.id}-${construction.targetLevel}`, type: 'FACILITY_UPGRADE', clubId: club.id, date, amount: cost, description: `Melhoria — ${view.name} · Nível ${view.level} → ${construction.targetLevel}` }, true)
  return Object.freeze({ ...next, facilities: Object.freeze(next.facilities.map(item => item.id === view.id ? Object.freeze({ ...item, construction }) : item)) })
}
export function nextFacilityDate(session: PrototypeSession) {
  const current = session.game.calendar.currentDate
  return [...paymentDates(addGameDays(current, 1), addGameDays(current, 62), session.facilityConfig.paymentDay), ...session.facilities.flatMap(item => item.construction && item.construction.completionDate > current ? [item.construction.completionDate] : []), ...session.stadiums.flatMap(stadium => stadium.sectors.flatMap(sector => sector.construction && sector.construction.completionDate > current ? [sector.construction.completionDate] : []))].sort()[0]
}
/** Processa intervalo em ordem; conclusão antes do pagamento da mesma data. Não move relógio. */
export function processFacilityDate(session: PrototypeSession, target = session.game.calendar.currentDate): PrototypeSession {
  assertDate(target, 'Data da estrutura')
  if (target < session.game.calendar.currentDate) throw new Error('Estrutura não pode regredir no tempo.')
  const dates = [...new Set([target, ...paymentDates(session.game.calendar.currentDate, target, session.facilityConfig.paymentDay), ...session.facilities.flatMap(item => item.construction && item.construction.completionDate <= target ? [item.construction.completionDate < session.game.calendar.currentDate ? session.game.calendar.currentDate : item.construction.completionDate] : []), ...session.stadiums.flatMap(stadium => stadium.sectors.flatMap(sector => sector.construction && sector.construction.completionDate <= target ? [sector.construction.completionDate < session.game.calendar.currentDate ? session.game.calendar.currentDate : sector.construction.completionDate] : []))])].sort()
  let next = session
  for (const date of dates) {
    next = Object.freeze({ ...next, stadiums: Object.freeze(next.stadiums.map(stadium => {
      let changed = false
      const sectors = stadium.sectors.map(sector => {
        const project = sector.construction
        if (!project || project.completionDate > date) return sector
        changed = true
        return Object.freeze({ ...sector, capacity: project.targetCapacity, expansionLevel: project.targetExpansionLevel, maintenanceCents: (sector.maintenanceCents ?? 0) + project.maintenanceCents, construction: undefined })
      })
      if (!changed) return stadium
      const updated = Object.freeze({ ...stadium, sectors: Object.freeze(sectors), capacity: sectors.reduce((sum, sector) => sum + sector.capacity, 0) })
      validateStadium(updated)
      return updated
    })) })
    if (next.facilities.some(item => item.construction && item.construction.completionDate <= date)) next = Object.freeze({ ...next, facilities: Object.freeze(next.facilities.map(item => {
      if (!item.construction || item.construction.completionDate > date) return item
      const max = next.facilityConfig.definitions.find(definition => definition.type === item.type)!.levels.length
      assertIntegerRange(item.construction.targetLevel, item.level + 1, Math.min(max, item.level + 1), 'Nível de conclusão')
      return Object.freeze({ id: item.id, clubId: item.clubId, type: item.type, level: item.construction.targetLevel })
    })) })
    if (Number(date.slice(8)) !== next.facilityConfig.paymentDay) continue
    for (const team of next.teams) {
      const totals = facilityMonthlyTotals(next, team.club.id), month = date.slice(0, 7)
      if (totals.baseMaintenance) next = transact(next, { id: `facility-maintenance-${team.club.id}-${month}`, type: 'FACILITY_MAINTENANCE', clubId: team.club.id, date, month, amount: createMoneyFromCents(totals.baseMaintenance), description: `Manutenção das instalações · ${month}` }, true)
      if (totals.stadiumMaintenance) next = transact(next, { id: `stadium-maintenance-${team.club.id}-${month}`, type: 'STADIUM_MAINTENANCE', clubId: team.club.id, date, month, amount: createMoneyFromCents(totals.stadiumMaintenance), description: `Manutenção do estádio · ${month}` }, true)
      if (totals.income) next = transact(next, { id: `merchandising-${team.club.id}-${month}`, type: 'MERCHANDISING', clubId: team.club.id, date, month, amount: createMoneyFromCents(totals.income), description: 'Receita mensal da Loja Oficial' }, false)
    }
  }
  return next
}
