import { assertIntegerRange } from '../../core/validation'

export const CLUB_PROFILE_FIELDS = [
  'youthPreference', 'transferAggressiveness', 'sellingPreference', 'financialRisk',
  'experiencedPlayerPreference',
] as const

/** Tendências independentes, cada uma em 0–100; não precisam somar 100. */
export type ClubProfile = Readonly<Record<(typeof CLUB_PROFILE_FIELDS)[number], number>>

export function validateClubProfile(profile: ClubProfile): void {
  for (const field of CLUB_PROFILE_FIELDS) {
    assertIntegerRange(profile[field], 0, 100, field)
  }
}

export function createClubProfile(profile: ClubProfile): ClubProfile {
  validateClubProfile(profile)
  return Object.freeze({ ...profile })
}
