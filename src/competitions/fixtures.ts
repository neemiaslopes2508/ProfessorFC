import { createId, validateId } from '../core/ids'
import type { ClubId, CompetitionSeasonId } from '../core/ids'
import { assertOneOf, assertUnique } from '../core/validation'
import type { LeagueFixture } from './types'

/** Método circular; ordem canônica por ID, sem RNG. Quantidade ímpar recebe folga. */
export function generateLeagueFixtures(seasonId: CompetitionSeasonId, participants: readonly ClubId[], legs: 1 | 2 = 2): readonly LeagueFixture[] {
  validateId(seasonId, 'CompetitionSeasonId')
  participants.forEach(id => validateId(id, 'ClubId'))
  assertUnique(participants, 'Participantes da liga')
  assertOneOf(legs, [1, 2], 'Turnos')
  if (participants.length < 2) throw new Error('Liga precisa de pelo menos dois clubes.')
  const rotation: (ClubId | null)[] = [...participants].sort()
  if (rotation.length % 2) rotation.push(null)
  const roundsPerLeg = rotation.length - 1
  const fixtures: LeagueFixture[] = []
  for (let round = 1; round <= roundsPerLeg; round++) {
    for (let index = 0; index < rotation.length / 2; index++) {
      const first = rotation[index]
      const second = rotation[rotation.length - 1 - index]
      if (first === null || second === null) continue
      const [homeClubId, awayClubId] = (round + index) % 2 ? [first, second] : [second, first]
      fixtures.push(Object.freeze({
        id: createId('Match', `${seasonId}:league:1:${round}:${index + 1}`),
        competitionSeasonId: seasonId, round, leg: 1, homeClubId, awayClubId,
      }))
    }
    rotation.splice(1, 0, rotation.pop()!)
  }
  if (legs === 2) {
    for (const fixture of [...fixtures]) fixtures.push(Object.freeze({
      ...fixture, id: createId('Match', `${seasonId}:league:2:${fixture.round}:${fixture.id.split(':').at(-1)}`),
      round: fixture.round + roundsPerLeg, leg: 2,
      homeClubId: fixture.awayClubId, awayClubId: fixture.homeClubId,
    }))
  }
  return Object.freeze(fixtures)
}
