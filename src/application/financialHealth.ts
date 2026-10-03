import { facilityMonthlyTotals } from './clubFacilities'
import type { ClubId } from '../core/ids'
import { createMoneyFromCents } from '../core/money'
import { addGameDays } from '../core/date'
import { transactionDirection } from '../finance/types'
import { clubPayroll } from './contractLifecycle'
import type { PrototypeSession } from './prototypeSession'

export const FINANCIAL_HEALTH_CONFIG = Object.freeze({ reservePayrollMonths: 1, minimumReserveCents: 0, warningMonths: 6, criticalMonths: 3, excellentPayrollMonths: 6 })
export type FinancialHealthStatus = 'EXCELLENT' | 'HEALTHY' | 'WARNING' | 'CRITICAL'

/** Estimativa conservadora: patrocínio vigente e folha atual constantes, sem bilheteria futura. */
export function financialHealth(session: PrototypeSession, clubId: ClubId, projectedPayroll?: number) {
  const club = session.teams.find(team => team.club.id === clubId)?.club
  if (!club) throw new Error('Clube inexistente na avaliação financeira.')
  const payroll = clubPayroll(session, clubId)
  const wages = createMoneyFromCents(projectedPayroll ?? payroll.current).cents
  const cash = club.finances.cashBalance.cents
  const structure = facilityMonthlyTotals(session, clubId)
  const currentDate = session.game.calendar.currentDate
  const commercialContract = session.commercial.contracts.find(item => item.clubId === clubId && item.status === 'ACTIVE' && item.startDate <= currentDate && currentDate < item.endDate)
  const legacySponsorIncome = clubId === session.game.humanClubId ? 0 : session.seasonRevenue.sponsors.filter(item => item.clubId === clubId).reduce<number>((sum, item) => sum + item.monthlyCents, 0)
  const sponsorshipIncome = commercialContract?.monthlyPaymentCents ?? legacySponsorIncome
  const monthlyIncome = createMoneyFromCents(sponsorshipIncome + structure.income).cents
  const recurringBalance = createMoneyFromCents(monthlyIncome - wages - structure.maintenance).cents
  const project = (months: number) => createMoneyFromCents(cash + months * recurringBalance).cents
  const projection3 = project(FINANCIAL_HEALTH_CONFIG.criticalMonths)
  const projection6 = project(FINANCIAL_HEALTH_CONFIG.warningMonths)
  const reserve = createMoneyFromCents(Math.max(FINANCIAL_HEALTH_CONFIG.minimumReserveCents, wages * FINANCIAL_HEALTH_CONFIG.reservePayrollMonths)).cents
  const status: FinancialHealthStatus = cash <= 0 || projection3 < 0 ? 'CRITICAL' : wages > payroll.budget || projection6 < 0 || cash < reserve ? 'WARNING' : cash >= wages * FINANCIAL_HEALTH_CONFIG.excellentPayrollMonths ? 'EXCELLENT' : 'HEALTHY'
  const availableTransferBudget = status === 'CRITICAL' ? 0 : Math.max(0, Math.min(club.finances.transferBudget.cents, cash - reserve))
  const ledger = session.financialTransactions.filter(item => item.clubId === clubId && item.date <= currentDate)
  let month = `${currentDate.slice(0, 7)}-01`
  const recent = Array.from({ length: 3 }, () => {
    const key = month.slice(0, 7)
    const items = ledger.filter(item => item.date.startsWith(key))
    const sum = (direction: 'INCOME' | 'EXPENSE') => createMoneyFromCents(items.filter(item => transactionDirection[item.type] === direction).reduce((sum, item) => sum + item.amount.cents, 0)).cents
    const income = sum('INCOME'), expenses = sum('EXPENSE')
    month = addGameDays(month, -1).slice(0, 7) + '-01'
    return { month: key, income, expenses, balance: createMoneyFromCents(income - expenses).cents, hasRecords: items.length > 0 }
  }).reverse()
  const alerts: string[] = []
  if (wages > payroll.budget) alerts.push('Folha salarial acima do limite. Novos contratos não podem aumentar a folha.')
  if (projection3 < 0 || projection6 < 0) alerts.push('Caixa pode ficar negativo nos próximos meses.')
  if (status === 'CRITICAL') alerts.push('Situação financeira crítica. Compras e aumentos de folha estão bloqueados.')
  if (availableTransferBudget < club.finances.transferBudget.cents) alerts.push('Orçamento de transferências comprometido pelo caixa e pela reserva salarial.')
  if (payroll.incomplete) alerts.push('Projeção parcial: há salários não informados.')
  return Object.freeze({ clubId, status, cash, monthlyBalance: recent[2].balance, monthlyIncome, monthlyExpenses: wages + structure.maintenance, recurringBalance, projection3, projection6, reserve, approvedTransferBudget: club.finances.transferBudget.cents, availableTransferBudget, payroll, alerts: Object.freeze(alerts), recent: Object.freeze(recent) })
}
export type FinancialHealthSnapshot = ReturnType<typeof financialHealth>
