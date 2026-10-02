import type { ClubId, CoachId, PlayerId } from '../../core/ids'
import { validateId } from '../../core/ids'
import { assertIntegerRange, assertNonEmptyString, assertUnique } from '../../core/validation'
import type { ClubProfile } from './profile'
import { createClubProfile, validateClubProfile } from './profile'
import type { ClubFinances } from './finances'
import { createClubFinances, validateClubFinances } from './finances'

export interface Club {
  readonly id: ClubId
  readonly name: string
  readonly shortName: string
  readonly country: string
  readonly reputation: number
  readonly stadiumId?: string
  readonly playerIds: readonly PlayerId[]
  readonly coachId?: CoachId
  readonly profile: ClubProfile
  readonly finances: ClubFinances
  readonly metadata?: Readonly<Record<string, unknown>>
}

export function validateClub(club: Club): void {
  validateId(club.id, 'ClubId')
  assertNonEmptyString(club.name, 'Nome do clube')
  assertNonEmptyString(club.shortName, 'Nome curto')
  assertNonEmptyString(club.country, 'País')
  assertIntegerRange(club.reputation, 0, 100, 'Reputação do clube')
  if (club.stadiumId !== undefined) validateId(club.stadiumId, 'StadiumId')
  if (club.coachId !== undefined) validateId(club.coachId, 'CoachId')
  club.playerIds.forEach(id => validateId(id, 'PlayerId'))
  assertUnique(club.playerIds, 'Elenco')
  validateClubProfile(club.profile)
  validateClubFinances(club.finances)
}

export function createClub(club: Club): Club {
  validateClub(club)
  return Object.freeze({
    ...club,
    playerIds: Object.freeze([...club.playerIds]),
    profile: createClubProfile(club.profile),
    finances: createClubFinances(club.finances),
  })
}
