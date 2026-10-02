import type { ClubId, CompetitionId, CompetitionSeasonId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertIntegerRange, assertOneOf, assertUnique } from '../../core/validation'

export const COMPETITION_SEASON_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'FINISHED'] as const
export type CompetitionSeasonStatus = (typeof COMPETITION_SEASON_STATUSES)[number]

export interface CompetitionSeason {
  readonly id: CompetitionSeasonId
  readonly competitionId: CompetitionId
  readonly year: number
  readonly participantClubIds: readonly ClubId[]
  readonly status: CompetitionSeasonStatus
  readonly championId?: ClubId
}

export function validateCompetitionSeason(season: CompetitionSeason): void {
  validateId(season.id, 'CompetitionSeasonId')
  validateId(season.competitionId, 'CompetitionId')
  assertIntegerRange(season.year, 1, 9999, 'Ano')
  assertOneOf(season.status, COMPETITION_SEASON_STATUSES, 'Estado da temporada')
  season.participantClubIds.forEach(id => validateId(id, 'ClubId'))
  assertUnique(season.participantClubIds, 'Participantes')
  if (season.championId !== undefined) {
    validateId(season.championId, 'ChampionId')
    if (!season.participantClubIds.includes(season.championId)) {
      throw new Error('Campeão deve ser um participante da edição.')
    }
  }
}

export function createCompetitionSeason(season: CompetitionSeason): CompetitionSeason {
  validateCompetitionSeason(season)
  return Object.freeze({ ...season, participantClubIds: Object.freeze([...season.participantClubIds]) })
}
