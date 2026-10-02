import type { SquadRole } from '../domain/contracts'
import { SQUAD_ROLES } from '../domain/contracts'
import { createMoneyFromCents, assertNonNegativeMoney } from '../core/money'
import { assertIntegerRange, assertOneOf } from '../core/validation'

export interface ContractTerms { readonly salaryCents: number; readonly years: number; readonly squadRole: SquadRole }
export interface ContractResponse { readonly status: 'ACCEPTED' | 'REJECTED' | 'COUNTERED'; readonly terms: ContractTerms; readonly counter?: ContractTerms; readonly message: string }
export const CONTRACT_CONFIG = Object.freeze({ minimumMonthlyCents: 300000, marketValueDivisor: 60, overallMonthlyCents: 20000, rejectionPercent: 50, reputationPercentPerPoint: 1 })

/** Expectativas de desenvolvimento: avaliação pura, sem sorte ou dependência da UI. */
export function contractExpectations(input: { overall: number; age: number; marketValueCents: number; currentSalaryCents?: number; currentRole?: SquadRole; originReputation: number; destinationReputation: number }): ContractTerms {
  const base = Math.max(CONTRACT_CONFIG.minimumMonthlyCents, Math.round(input.marketValueCents / CONTRACT_CONFIG.marketValueDivisor), input.overall * CONTRACT_CONFIG.overallMonthlyCents, input.currentSalaryCents ?? 0)
  const reputationPremium = Math.max(0, input.originReputation - input.destinationReputation) * CONTRACT_CONFIG.reputationPercentPerPoint
  const role: SquadRole = input.overall >= 80 ? 'STAR_PLAYER' : input.overall >= 65 ? 'IMPORTANT' : input.age <= 21 ? 'PROSPECT' : input.overall >= 55 ? 'ROTATION' : 'BACKUP'
  return Object.freeze({ salaryCents: Math.ceil(base * (100 + reputationPremium) / 100), years: input.age >= 32 ? 1 : input.age >= 29 ? 2 : 3, squadRole: SQUAD_ROLES[Math.max(SQUAD_ROLES.indexOf(role), SQUAD_ROLES.indexOf(input.currentRole ?? role))] })
}
export function evaluateContract(terms: ContractTerms, expected: ContractTerms): ContractResponse {
  assertNonNegativeMoney(createMoneyFromCents(terms.salaryCents), 'Salário')
  assertIntegerRange(terms.years, 1, 5, 'Duração em anos')
  assertOneOf(terms.squadRole, SQUAD_ROLES, 'Papel no elenco')
  const proposal = Object.freeze({ ...terms })
  if (terms.salaryCents * 100 < expected.salaryCents * CONTRACT_CONFIG.rejectionPercent) return Object.freeze({ status: 'REJECTED', terms: proposal, message: 'O salário está muito abaixo da minha expectativa.' })
  const salaryLow = terms.salaryCents < expected.salaryCents
  const roleLow = SQUAD_ROLES.indexOf(terms.squadRole) < SQUAD_ROLES.indexOf(expected.squadRole)
  const durationMismatch = terms.years !== expected.years
  if (salaryLow || roleLow || durationMismatch) return Object.freeze({ status: 'COUNTERED', terms: proposal, counter: Object.freeze({ salaryCents: Math.max(terms.salaryCents, expected.salaryCents), years: expected.years, squadRole: roleLow ? expected.squadRole : terms.squadRole }), message: salaryLow ? 'Quero um salário maior.' : roleLow ? 'Espero um papel maior no elenco.' : 'Prefiro outra duração de contrato.' })
  return Object.freeze({ status: 'ACCEPTED', terms: proposal, message: 'Aceito os termos.' })
}

/** Anos civis completos; 29/02 termina em 28/02 nos anos não bissextos. */
export function contractEndDate(startDate: string, years: number): string {
  assertIntegerRange(years, 1, 5, 'Duração em anos')
  const date = new Date(`${startDate}T00:00:00Z`)
  const month = date.getUTCMonth()
  date.setUTCFullYear(date.getUTCFullYear() + years)
  if (date.getUTCMonth() !== month) date.setUTCDate(0)
  return date.toISOString().slice(0, 10)
}
