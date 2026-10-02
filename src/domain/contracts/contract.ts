import type { ClubId, ContractId, PlayerId } from '../../core/ids'
import { validateId } from '../../core/ids'
import type { Money } from '../../core/money'
import { assertNonNegativeMoney, createMoneyFromCents } from '../../core/money'
import { assertDate, assertOneOf } from '../../core/validation'

export const CONTRACT_STATUSES = ['ACTIVE', 'EXPIRED', 'TERMINATED'] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export interface Contract {
  readonly id: ContractId
  readonly playerId: PlayerId
  readonly clubId: ClubId
  readonly startDate: string
  readonly endDate: string
  readonly salary: Money
  readonly status: ContractStatus
}

export function validateContract(contract: Contract): void {
  validateId(contract.id, 'ContractId')
  validateId(contract.playerId, 'PlayerId')
  validateId(contract.clubId, 'ClubId')
  assertDate(contract.startDate, 'Início do contrato')
  assertDate(contract.endDate, 'Fim do contrato')
  if (contract.endDate <= contract.startDate) {
    throw new Error('Fim do contrato deve ser posterior ao início.')
  }
  assertNonNegativeMoney(contract.salary, 'Salário')
  assertOneOf(contract.status, CONTRACT_STATUSES, 'Estado do contrato')
}

export function createContract(contract: Contract): Contract {
  validateContract(contract)
  return Object.freeze({ ...contract, salary: createMoneyFromCents(contract.salary.cents) })
}
