import type { Player } from '../domain/players'
import type { Contract } from '../domain/contracts'
import { createMoneyFromCents } from '../core/money'

export const TRANSFER_CONFIG = Object.freeze({ rejectionBasisPoints: 6500, starterPremium: 2000, veteranDiscount: 1000, expiringDiscount: 1500, longContractPremium: 1000, cpuOfferBasisPoints: 9000, cpuCounterLimitBasisPoints: 11000 })

/** Critérios transparentes de desenvolvimento, sem aleatoriedade ou ratings persistidos. */
export function askingFee(player: Player, age: number, starter: boolean, date: string, contract?: Contract) {
  const remaining = contract ? (Date.parse(contract.endDate) - Date.parse(date)) / 86400000 : undefined
  const basisPoints = 10000 + (starter ? TRANSFER_CONFIG.starterPremium : 0) - (age >= 30 ? TRANSFER_CONFIG.veteranDiscount : 0)
    + (remaining !== undefined && remaining <= 365 ? -TRANSFER_CONFIG.expiringDiscount : remaining !== undefined && remaining > 730 ? TRANSFER_CONFIG.longContractPremium : 0)
  return createMoneyFromCents(Math.max(1, Math.round(player.marketValue.cents * basisPoints / 10000)))
}
export function evaluateOffer(offeredCents: number, askingCents: number): 'ACCEPTED' | 'REJECTED' | 'COUNTERED' {
  return offeredCents >= askingCents ? 'ACCEPTED' : offeredCents < Math.round(askingCents * TRANSFER_CONFIG.rejectionBasisPoints / 10000) ? 'REJECTED' : 'COUNTERED'
}
