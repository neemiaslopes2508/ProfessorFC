import { validateId } from '../core/ids'
import { assertDate, assertIntegerRange, assertNonEmptyString, assertOneOf } from '../core/validation'
import { validatePlayer } from '../domain/players'
import { validateClub } from '../domain/clubs'
import { validateCoach } from '../domain/coaches'
import { validateCompetition, validateCompetitionSeason } from '../domain/competitions'
import { GAME_DATA_KINDS } from './gameData'
import type { GameData } from './gameData'

export type ValidationErrorCode =
  | 'INVALID_METADATA'
  | 'INVALID_ENTITY'
  | 'DUPLICATE_ID'
  | 'MISSING_REFERENCE'
  | 'INCONSISTENT_RELATION'
  | 'MULTIPLE_CLUBS'
  | 'DEVELOPMENT_DATA_NOT_OFFICIAL'
  | 'UNCLONEABLE_DATA'

export interface ValidationError {
  readonly code: ValidationErrorCode
  readonly path: string
  readonly message: string
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly ValidationError[]
}

export function validateGameData(data: GameData): ValidationResult {
  const errors: ValidationError[] = []
  const seenIds = new Map<string, string>()

  function report(code: ValidationErrorCode, path: string, message: string): void {
    errors.push({ code, path, message })
  }

  function checkMetadata(path: string, check: () => void): void {
    try {
      check()
    } catch (error) {
      report('INVALID_METADATA', path, error instanceof Error ? error.message : String(error))
    }
  }

  checkMetadata('id', () => validateId(data.id, 'ID da base'))
  checkMetadata('kind', () => assertOneOf(data.kind, GAME_DATA_KINDS, 'Origem da base'))
  checkMetadata('source', () => assertNonEmptyString(data.source, 'Fonte'))
  checkMetadata('referenceDate', () => assertDate(data.referenceDate, 'Data de referência'))
  checkMetadata('initialYear', () => assertIntegerRange(data.initialYear, 1, 9999, 'Ano inicial'))

  // Reutiliza invariantes locais; referências só são analisadas em entidades válidas.
  function index<T extends { readonly id: string }>(
    entities: readonly T[], collection: string, validate: (entity: T) => void,
  ): Map<T['id'], { entity: T; path: string }> {
    const result = new Map<T['id'], { entity: T; path: string }>()
    entities.forEach((entity, position) => {
      const path = `${collection}[${position}]`
      try {
        validate(entity)
      } catch (error) {
        report('INVALID_ENTITY', path, error instanceof Error ? error.message : String(error))
        return
      }
      const previousPath = seenIds.get(entity.id)
      if (previousPath !== undefined) {
        report('DUPLICATE_ID', `${path}.id`, `ID "${entity.id}" já utilizado em ${previousPath}.`)
      } else {
        seenIds.set(entity.id, `${path}.id`)
      }
      if (!result.has(entity.id)) result.set(entity.id, { entity, path })
    })
    return result
  }

  const players = index(data.players, 'players', validatePlayer)
  const clubs = index(data.clubs, 'clubs', validateClub)
  const coaches = index(data.coaches, 'coaches', validateCoach)
  const competitions = index(data.competitions, 'competitions', validateCompetition)
  const seasons = index(data.competitionSeasons, 'competitionSeasons', validateCompetitionSeason)
  const rosterMembership = new Map<string, string>()

  for (const { entity: club, path } of clubs.values()) {
    club.playerIds.forEach((playerId, position) => {
      const referencePath = `${path}.playerIds[${position}]`
      const player = players.get(playerId)?.entity
      if (!player) {
        report('MISSING_REFERENCE', referencePath, `Jogador "${playerId}" não existe ou é inválido.`)
      } else if (player.clubId !== club.id) {
        report('INCONSISTENT_RELATION', referencePath, `Jogador "${playerId}" não aponta para o clube "${club.id}".`)
      }
      const previousClub = rosterMembership.get(playerId)
      if (previousClub !== undefined && previousClub !== club.id) {
        report('MULTIPLE_CLUBS', referencePath, `Jogador "${playerId}" aparece nos clubes "${previousClub}" e "${club.id}".`)
      } else {
        rosterMembership.set(playerId, club.id)
      }
    })
    if (club.coachId !== undefined) {
      const coach = coaches.get(club.coachId)?.entity
      if (!coach) {
        report('MISSING_REFERENCE', `${path}.coachId`, `Treinador "${club.coachId}" não existe ou é inválido.`)
      } else if (coach.currentClubId !== club.id) {
        report('INCONSISTENT_RELATION', `${path}.coachId`, `Treinador "${coach.id}" não aponta para o clube "${club.id}".`)
      }
    }
  }

  for (const { entity: player, path } of players.values()) {
    if (player.clubId === null) continue
    const club = clubs.get(player.clubId)?.entity
    if (!club) {
      report('MISSING_REFERENCE', `${path}.clubId`, `Clube "${player.clubId}" do jogador "${player.id}" não existe ou é inválido.`)
    } else if (!club.playerIds.includes(player.id)) {
      report('INCONSISTENT_RELATION', `${path}.clubId`, `Jogador "${player.id}" não está no elenco do clube "${club.id}".`)
    }
  }

  for (const { entity: coach, path } of coaches.values()) {
    if (coach.currentClubId === undefined) continue
    const club = clubs.get(coach.currentClubId)?.entity
    if (!club) {
      report('MISSING_REFERENCE', `${path}.currentClubId`, `Clube "${coach.currentClubId}" do treinador "${coach.id}" não existe ou é inválido.`)
    } else if (club.coachId !== coach.id) {
      report('INCONSISTENT_RELATION', `${path}.currentClubId`, `Clube "${club.id}" não aponta para o treinador "${coach.id}".`)
    }
  }

  for (const { entity: season, path } of seasons.values()) {
    if (!competitions.has(season.competitionId)) {
      report('MISSING_REFERENCE', `${path}.competitionId`, `Competição "${season.competitionId}" não existe ou é inválida.`)
    }
    season.participantClubIds.forEach((clubId, position) => {
      if (!clubs.has(clubId)) {
        report('MISSING_REFERENCE', `${path}.participantClubIds[${position}]`, `Clube participante "${clubId}" não existe ou é inválido.`)
      }
    })
  }

  return { valid: errors.length === 0, errors }
}
