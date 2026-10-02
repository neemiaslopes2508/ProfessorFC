import { createPlayer } from '../domain/players'
import type { Player } from '../domain/players'
import { createClub } from '../domain/clubs'
import type { Club } from '../domain/clubs'
import { createCoach } from '../domain/coaches'
import type { Coach } from '../domain/coaches'
import { createCompetition, createCompetitionSeason } from '../domain/competitions'
import type { Competition, CompetitionSeason } from '../domain/competitions'
import type { GameData } from './gameData'
import { createInMemoryRepository } from './repositories/inMemory'
import type { InMemoryRepository } from './repositories/inMemory'
import { validateGameData } from './validation'
import type { ValidationResult } from './validation'

export interface GameDataRepositories {
  readonly players: InMemoryRepository<Player>
  readonly clubs: InMemoryRepository<Club>
  readonly coaches: InMemoryRepository<Coach>
  readonly competitions: InMemoryRepository<Competition>
  readonly competitionSeasons: InMemoryRepository<CompetitionSeason>
}

export type LoadGameDataResult =
  | { readonly ok: true; readonly data: GameData; readonly repositories: GameDataRepositories }
  | { readonly ok: false; readonly validation: ValidationResult }

/** Entrada já no modelo interno; não é parser/importador de fontes externas. */
export function loadGameData(
  input: GameData,
  usage: 'development' | 'official',
): LoadGameDataResult {
  const validation = validateGameData(input)
  if (input.kind === 'DEVELOPMENT_FIXTURE' && usage === 'official') {
    return {
      ok: false,
      validation: {
        valid: false,
        errors: [...validation.errors, {
          code: 'DEVELOPMENT_DATA_NOT_OFFICIAL', path: 'kind',
          message: 'Fixtures fictícias são exclusivas de desenvolvimento e nunca são a base oficial do Professor FC.',
        }],
      },
    }
  }
  if (!validation.valid) return { ok: false, validation }

  // Cópia independente da entrada; carreira futura deverá criar seu próprio estado.
  let snapshot: GameData
  try {
    snapshot = structuredClone(input)
  } catch (error) {
    return {
      ok: false,
      validation: {
        valid: false,
        errors: [{
          code: 'UNCLONEABLE_DATA', path: 'data',
          message: `Dados e metadados devem permitir cópia independente: ${error instanceof Error ? error.message : String(error)}`,
        }],
      },
    }
  }
  const data: GameData = Object.freeze({
    ...snapshot,
    players: Object.freeze(snapshot.players.map(createPlayer)),
    clubs: Object.freeze(snapshot.clubs.map(createClub)),
    coaches: Object.freeze(snapshot.coaches.map(createCoach)),
    competitions: Object.freeze(snapshot.competitions.map(createCompetition)),
    competitionSeasons: Object.freeze(snapshot.competitionSeasons.map(createCompetitionSeason)),
  })
  return {
    ok: true,
    data,
    repositories: Object.freeze({
      players: createInMemoryRepository(data.players),
      clubs: createInMemoryRepository(data.clubs),
      coaches: createInMemoryRepository(data.coaches),
      competitions: createInMemoryRepository(data.competitions),
      competitionSeasons: createInMemoryRepository(data.competitionSeasons),
    }),
  }
}
