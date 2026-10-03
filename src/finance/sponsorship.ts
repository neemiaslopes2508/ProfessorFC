import type { ClubId, CompetitionSeasonId } from '../core/ids'

export type SponsorCategory = 'MAIN'
export interface Sponsor {
  readonly id: string
  readonly name: string
  readonly category: SponsorCategory
  readonly weight: number
}
export type SponsorObjective =
  | { readonly type: 'FINISH_POSITION'; readonly target: number; readonly bonusCents: number }
  | { readonly type: 'WIN_COMPETITION'; readonly competitionSeasonId: CompetitionSeasonId; readonly bonusCents: number }
  | { readonly type: 'FINANCIAL_HEALTH'; readonly bonusCents: number }
export interface SponsorOffer {
  readonly id: string
  readonly sponsorId: string
  readonly clubId: ClubId
  readonly seasonYear: number
  readonly startDate: string
  readonly endDate: string
  readonly durationSeasons: 1 | 2 | 3
  readonly signingBonusCents: number
  readonly monthlyPaymentCents: number
  readonly objective: SponsorObjective
  readonly status: 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
}
export interface SponsorshipContract {
  readonly id: string
  readonly sponsorId: string
  readonly clubId: ClubId
  readonly startDate: string
  /** Data final exclusiva, seguindo os contratos de jogadores. */
  readonly endDate: string
  readonly durationSeasons: 1 | 2 | 3
  readonly signingBonusCents: number
  readonly monthlyPaymentCents: number
  readonly objective: SponsorObjective
  readonly objectiveStatus: 'PENDING' | 'ACHIEVED' | 'MISSED'
  readonly status: 'ACTIVE' | 'FINISHED'
}
export interface CommercialState {
  readonly sponsors: readonly Sponsor[]
  readonly offers: readonly SponsorOffer[]
  readonly contracts: readonly SponsorshipContract[]
}

/** Catálogo fictício substituível por conteúdo; regras não dependem das marcas. */
export const DEVELOPMENT_SPONSORS: readonly Sponsor[] = Object.freeze([
  { id: 'aurora', name: 'Aurora Energia', category: 'MAIN', weight: 5 },
  { id: 'norte', name: 'Norte Telecom', category: 'MAIN', weight: 4 },
  { id: 'campo', name: 'Campo Forte', category: 'MAIN', weight: 3 },
  { id: 'orbita', name: 'Órbita Seguros', category: 'MAIN', weight: 2 },
  { id: 'brava', name: 'Brava Alimentos', category: 'MAIN', weight: 1 },
])

export const SPONSORSHIP_CONFIG = Object.freeze({
  monthlyPaymentDay: 1,
  offerCount: 3,
  monthlyPaymentBaseCents: 2_500_000,
  monthlyPaymentStepCents: 750_000,
  signingBonusOptionsCents: Object.freeze([0, 2_500_000, 5_000_000]),
  objectiveBonusOptionsCents: Object.freeze([5_000_000, 10_000_000, 15_000_000]),
})

