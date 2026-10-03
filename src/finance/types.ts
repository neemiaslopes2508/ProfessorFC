import type { ClubId, PlayerId, MatchId, CompetitionSeasonId } from '../core/ids'
import type { StadiumAttendance } from './stadium'
import type { Money } from '../core/money'

export type FinanceTransactionType = 'PLAYER_WAGES' | 'PLAYER_PURCHASE' | 'PLAYER_SALE' | 'MATCH_TICKETS' | 'SPONSORSHIP' | 'SPONSOR_SIGNING_BONUS' | 'SPONSOR_OBJECTIVE_BONUS' | 'COMPETITION_PRIZE' | 'FACILITY_UPGRADE' | 'FACILITY_MAINTENANCE' | 'STADIUM_EXPANSION' | 'STADIUM_MAINTENANCE' | 'MERCHANDISING'
/** Valores positivos em centavos; receita/despesa deriva exclusivamente do tipo. */
export interface FinanceTransaction {
  readonly id: string
  readonly type: FinanceTransactionType
  readonly clubId: ClubId
  readonly date: string
  readonly amount: Money
  readonly description?: string
  readonly month?: string
  readonly playerId?: PlayerId
  readonly transferId?: string
  readonly matchId?: MatchId
  readonly competitionSeasonId?: CompetitionSeasonId
  readonly attendance?: number
  readonly stadiumAttendance?: StadiumAttendance
  readonly position?: number
}
export const transactionDirection: Readonly<Record<FinanceTransactionType, 'INCOME' | 'EXPENSE'>> = Object.freeze({ PLAYER_WAGES: 'EXPENSE', PLAYER_PURCHASE: 'EXPENSE', PLAYER_SALE: 'INCOME', MATCH_TICKETS: 'INCOME', SPONSORSHIP: 'INCOME', SPONSOR_SIGNING_BONUS: 'INCOME', SPONSOR_OBJECTIVE_BONUS: 'INCOME', COMPETITION_PRIZE: 'INCOME', FACILITY_UPGRADE: 'EXPENSE', FACILITY_MAINTENANCE: 'EXPENSE', STADIUM_EXPANSION: 'EXPENSE', STADIUM_MAINTENANCE: 'EXPENSE', MERCHANDISING: 'INCOME' })
