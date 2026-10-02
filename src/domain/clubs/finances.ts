import type { Money } from '../../core/money'
import { assertNonNegativeMoney, createMoneyFromCents, validateMoney } from '../../core/money'

export interface ClubFinances {
  readonly cashBalance: Money
  readonly transferBudget: Money
  readonly wageBudget: Money
}

export function validateClubFinances(finances: ClubFinances): void {
  validateMoney(finances.cashBalance)
  assertNonNegativeMoney(finances.transferBudget, 'Orçamento de transferências')
  assertNonNegativeMoney(finances.wageBudget, 'Orçamento salarial')
}

export function createClubFinances(finances: ClubFinances): ClubFinances {
  validateClubFinances(finances)
  return Object.freeze({
    cashBalance: createMoneyFromCents(finances.cashBalance.cents),
    transferBudget: createMoneyFromCents(finances.transferBudget.cents),
    wageBudget: createMoneyFromCents(finances.wageBudget.cents),
  })
}
