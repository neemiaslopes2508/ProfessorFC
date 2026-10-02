import type { ClubId, PlayerId } from '../../core/ids'
import type { Club } from '../clubs'
import type { Player } from '../players'
import { FORMATION_POSITIONS } from './formations'
import { createLineup, validateLineup } from './lineup'
import type { Lineup } from './lineup'
import { createTactics, validateTactics } from './tactics'
import type { Tactics } from './tactics'

export type TeamSelectionErrorCode =
  | 'INVALID_LINEUP'
  | 'INVALID_TACTICS'
  | 'FORMATION_MISMATCH'
  | 'PLAYER_NOT_FOUND'
  | 'PLAYER_NOT_IN_CLUB'
  | 'PLAYER_UNAVAILABLE'

export interface TeamSelectionError {
  readonly code: TeamSelectionErrorCode
  readonly path: string
  readonly message: string
  readonly playerId?: PlayerId
}

export interface TeamSelectionWarning {
  readonly code: 'OUT_OF_POSITION'
  readonly path: string
  readonly message: string
  readonly playerId: PlayerId
}

export interface TeamSelectionValidation {
  readonly valid: boolean
  readonly errors: readonly TeamSelectionError[]
  readonly warnings: readonly TeamSelectionWarning[]
}

/** Snapshot de entidades de domínio válidas, com IDs únicos, sem depender de repository. */
export interface TeamSelectionContext {
  readonly club: Club
  readonly players: readonly Player[]
}

export interface TeamSelection {
  readonly clubId: ClubId
  readonly lineup: Lineup
  readonly tactics: Tactics
}

export type PreparedTeamSelection =
  | { readonly ok: true; readonly selection: TeamSelection; readonly warnings: readonly TeamSelectionWarning[] }
  | { readonly ok: false; readonly validation: TeamSelectionValidation }

export function validateTeamSelection(
  lineup: Lineup, tactics: Tactics, context: TeamSelectionContext,
): TeamSelectionValidation {
  const errors: TeamSelectionError[] = []
  const warnings: TeamSelectionWarning[] = []
  try {
    validateLineup(lineup)
  } catch (error) {
    errors.push({ code: 'INVALID_LINEUP', path: 'lineup', message: error instanceof Error ? error.message : String(error) })
  }
  try {
    validateTactics(tactics)
  } catch (error) {
    errors.push({ code: 'INVALID_TACTICS', path: 'tactics', message: error instanceof Error ? error.message : String(error) })
  }
  // Evita alertas contextuais derivados de uma estrutura localmente inválida.
  if (errors.length > 0) return { valid: false, errors, warnings }

  const expected = FORMATION_POSITIONS[tactics.formation]
  const assigned = lineup.positions.map(assignment => assignment.position)
  if (expected.some(position =>
    expected.filter(slot => slot === position).length !== assigned.filter(slot => slot === position).length,
  )) {
    errors.push({
      code: 'FORMATION_MISMATCH', path: 'lineup.positions',
      message: `Posições atribuídas não correspondem à distribuição da formação ${tactics.formation}.`,
    })
  }

  const players = new Map(context.players.map(player => [player.id, player]))
  const roster = new Set(context.club.playerIds)
  const eligiblePlayers = new Map<PlayerId, Player>()
  for (const [group, ids] of [['startingPlayers', lineup.startingPlayers], ['bench', lineup.bench]] as const) {
    ids.forEach((playerId, index) => {
      const path = `lineup.${group}[${index}]`
      const player = players.get(playerId)
      if (!player) {
        errors.push({ code: 'PLAYER_NOT_FOUND', path, playerId, message: `Jogador "${playerId}" não foi encontrado no contexto.` })
        return
      }
      if (player.clubId !== context.club.id || !roster.has(playerId)) {
        errors.push({ code: 'PLAYER_NOT_IN_CLUB', path, playerId, message: `Jogador "${playerId}" não pertence ao elenco do clube "${context.club.id}".` })
        return
      }
      if (player.status !== 'AVAILABLE') {
        errors.push({ code: 'PLAYER_UNAVAILABLE', path, playerId, message: `Jogador "${playerId}" indisponível: ${player.status}.` })
        return
      }
      eligiblePlayers.set(playerId, player)
    })
  }

  lineup.positions.forEach((assignment, index) => {
    const player = eligiblePlayers.get(assignment.playerId)
    if (!player) return
    if (player.primaryPosition !== assignment.position && !player.secondaryPositions.includes(assignment.position)) {
      warnings.push({
        code: 'OUT_OF_POSITION', path: `lineup.positions[${index}]`, playerId: player.id,
        message: `Jogador "${player.id}" escalado em ${assignment.position}, fora da posição natural ${player.primaryPosition} e das posições secundárias.`,
      })
    }
  })
  return { valid: errors.length === 0, errors, warnings }
}

/** Só entrega seleção consumível quando não há impedimentos; alertas permanecem visíveis. */
export function prepareTeamSelection(
  lineup: Lineup, tactics: Tactics, context: TeamSelectionContext,
): PreparedTeamSelection {
  const validation = validateTeamSelection(lineup, tactics, context)
  if (!validation.valid) return { ok: false, validation }
  return {
    ok: true,
    selection: Object.freeze({
      clubId: context.club.id, lineup: createLineup(lineup), tactics: createTactics(tactics),
    }),
    warnings: validation.warnings,
  }
}
