import type { Club } from '../domain/clubs'
import type { Competition } from '../domain/competitions'
import type { ClubId, CompetitionId } from '../core/ids'

export interface SeasonRevenueConfig {
  readonly sponsorshipDay: number
  readonly sponsors: readonly { readonly clubId: ClubId; readonly monthlyCents: number }[]
  readonly competitions: readonly { readonly competitionId: CompetitionId; readonly name: string; readonly prizeByPositionCents: readonly number[] }[]
}
export const DEVELOPMENT_REVENUE_CONFIG = Object.freeze({ sponsorshipDay: 1, sponsorBaseCents: 2000000, sponsorPerReputationCents: 100000, prizeByPositionCents: Object.freeze([200000000, 125000000, 80000000, 50000000, 30000000, 20000000]) })
/** Configuração fictícia da sessão; competições sem regra cadastrada não pagam prêmio. */
export function createDevelopmentRevenueConfig(clubs: readonly Club[], competition: Competition): SeasonRevenueConfig {
  return Object.freeze({ sponsorshipDay: DEVELOPMENT_REVENUE_CONFIG.sponsorshipDay,
    sponsors: Object.freeze(clubs.map(club => Object.freeze({ clubId: club.id, monthlyCents: DEVELOPMENT_REVENUE_CONFIG.sponsorBaseCents + club.reputation * DEVELOPMENT_REVENUE_CONFIG.sponsorPerReputationCents }))),
    competitions: Object.freeze([Object.freeze({ competitionId: competition.id, name: competition.name, prizeByPositionCents: DEVELOPMENT_REVENUE_CONFIG.prizeByPositionCents })]),
  })
}
