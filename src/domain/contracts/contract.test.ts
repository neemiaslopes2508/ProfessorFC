import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createMoneyFromCents } from '../../core/money'
import { CONTRACT_STATUSES, createContract } from './contract'
import type { Contract } from './contract'

function contract(): Contract {
  return {
    id: createId('Contract', 'test-contract'), playerId: createId('Player', 'test-player'), clubId: createId('Club', 'test-club'),
    startDate: '2026-01-01', endDate: '2026-12-31', salary: createMoneyFromCents(10000), status: 'ACTIVE',
  }
}

describe('Contract', () => {
  it('aceita fim posterior ao início e salário em centavos', () => {
    expect(createContract(contract()).salary.cents).toBe(10000)
  })
  it.each(['2025-12-31', '2026-01-01'])('rejeita fim anterior ou igual ao início: %s', endDate => {
    expect(() => createContract({ ...contract(), endDate })).toThrow(/posterior/)
  })
  it('aceita intervalo de um dia e datas bissextas válidas', () => {
    expect(() => createContract({ ...contract(), startDate: '2028-02-29', endDate: '2028-03-01' })).not.toThrow()
  })
  it.each(['startDate', 'endDate'] as const)('rejeita %s inexistente no calendário', field => {
    expect(() => createContract({ ...contract(), [field]: '2026-02-30' })).toThrow()
  })
  it('rejeita salário negativo e aceita zero', () => {
    expect(() => createContract({ ...contract(), salary: createMoneyFromCents(-1) })).toThrow()
    expect(createContract({ ...contract(), salary: createMoneyFromCents(0) }).salary.cents).toBe(0)
  })
  it.each(CONTRACT_STATUSES)('representa %s sem mudar status automaticamente', status => {
    expect(createContract({ ...contract(), status }).status).toBe(status)
  })
})
