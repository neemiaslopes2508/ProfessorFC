import type { ClubId, PlayerId } from '../core/ids'
import type { Money } from '../core/money'
import type { Contract } from '../domain/contracts'
import type { ContractResponse } from './playerContract'

export type NegotiationStatus = 'PENDING' | 'CLUB_ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'COMPLETED' | 'CANCELLED'
export interface TransferNegotiation {
  readonly negotiationId: string
  readonly playerId: PlayerId
  readonly buyingClubId: ClubId
  readonly sellingClubId: ClubId
  readonly offeredFee: Money
  readonly counterFee?: Money
  readonly status: NegotiationStatus
  readonly contractOffer?: ContractResponse
}
export interface CompletedTransfer {
  readonly negotiationId: string
  readonly playerId: PlayerId
  readonly fromClubId: ClubId
  readonly toClubId: ClubId
  readonly fee: Money
  readonly date: string
}
export interface TransferMarket {
  readonly listedPlayerIds: readonly PlayerId[]
  readonly negotiations: readonly TransferNegotiation[]
  readonly history: readonly CompletedTransfer[]
  readonly contracts: readonly Contract[]
}
export const EMPTY_TRANSFER_MARKET: TransferMarket = Object.freeze({ listedPlayerIds: Object.freeze([]), negotiations: Object.freeze([]), history: Object.freeze([]), contracts: Object.freeze([]) })
