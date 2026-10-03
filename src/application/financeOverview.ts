import type { PrototypeSession } from './prototypeSession'
import { financialHealth } from './financialHealth'
import { humanTeam } from './prototypeSession'
import { clubPayroll } from './contractLifecycle'
import { createMoneyFromCents } from '../core/money'
import { transactionDirection } from '../finance/types'
import type { FinanceTransaction } from '../finance/types'

export type FinancePeriod = 'MONTH' | 'SEASON'
export type FinanceDirection = 'ALL' | 'INCOME' | 'EXPENSE'
function total(items: readonly FinanceTransaction[]) {
  return createMoneyFromCents(items.reduce((sum, item) => sum + item.amount.cents, 0)).cents
}
export function financeOverview(session: PrototypeSession, period: FinancePeriod = 'MONTH', direction: FinanceDirection = 'ALL') {
  const club = humanTeam(session).club
  const month = session.game.calendar.currentDate.slice(0, 7)
  const year = session.game.competitions[0].league.season.year
  const ledger = session.financialTransactions.filter(item => item.clubId === club.id && item.date <= session.game.calendar.currentDate)
  const monthly = ledger.filter(item => item.date.startsWith(month))
  const income = total(monthly.filter(item => transactionDirection[item.type] === 'INCOME'))
  const expenses = total(monthly.filter(item => transactionDirection[item.type] === 'EXPENSE'))
  const balance = createMoneyFromCents(income - expenses).cents
  const balanceStatus: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = balance > 0 ? 'POSITIVE' : balance < 0 ? 'NEGATIVE' : 'NEUTRAL'
  const seasonal = ledger.filter(item => item.date.startsWith(`${year}-`))
  const scoped = period === 'MONTH' ? monthly : seasonal
  const categories = [...new Set(scoped.map(item => item.type))].map(type => ({ type, direction: transactionDirection[type], total: total(scoped.filter(item => item.type === type)) })).filter(item => item.total > 0).sort((a, b) => b.total - a.total || a.type.localeCompare(b.type))
  return {
    club, month, year, health: financialHealth(session, club.id), payroll: clubPayroll(session, club.id), income, expenses, balance,
    balanceStatus, seasonIncome: total(seasonal.filter(item => transactionDirection[item.type] === 'INCOME')),
    purchases: total(seasonal.filter(item => item.type === 'PLAYER_PURCHASE')),
    sales: total(seasonal.filter(item => item.type === 'PLAYER_SALE')),
    expenseCategories: categories.filter(item => item.direction === 'EXPENSE'),
    incomeCategories: categories.filter(item => item.direction === 'INCOME'),
    transactions: scoped.filter(item => direction === 'ALL' || transactionDirection[item.type] === direction).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
  }
}
