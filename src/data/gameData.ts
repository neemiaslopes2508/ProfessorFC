import type { Player } from '../domain/players'
import type { Club } from '../domain/clubs'
import type { Coach } from '../domain/coaches'
import type { Competition, CompetitionSeason } from '../domain/competitions'

export const GAME_DATA_KINDS = ['DEVELOPMENT_FIXTURE', 'REAL_BASE'] as const
export type GameDataKind = (typeof GAME_DATA_KINDS)[number]

/** Base inicial. Não contém treinador humano selecionado, relógio ou save da carreira. */
export interface GameData {
  readonly id: string
  readonly kind: GameDataKind
  readonly source: string
  readonly referenceDate: string
  readonly initialYear: number
  readonly players: readonly Player[]
  readonly clubs: readonly Club[]
  readonly coaches: readonly Coach[]
  readonly competitions: readonly Competition[]
  readonly competitionSeasons: readonly CompetitionSeason[]
}
