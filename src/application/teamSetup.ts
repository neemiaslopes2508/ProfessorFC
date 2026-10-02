import type { ClubId, PlayerId } from '../core/ids'
import { createLineup, createTactics, validateTeamSelection } from '../domain/tactics'
import type { Lineup, Tactics, TeamSelectionValidation } from '../domain/tactics'
import { humanTeam, starterSlots } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'

/** Configuração editável da sessão, sem carreira/persistência. A sessão confirmada é a fonte do motor. */
export interface TeamSetup {
  readonly clubId: ClubId
  readonly lineup: Lineup
  readonly tactics: Tactics
  readonly starterSlots: readonly (PlayerId | undefined)[]
}

export function captureTeamSetup(session: PrototypeSession): TeamSetup {
  const team = humanTeam(session)
  return Object.freeze({ clubId: team.club.id, tactics: createTactics(team.tactics),
    starterSlots: Object.freeze([...starterSlots(session)]),
    lineup: Object.freeze({ startingPlayers: Object.freeze([...team.lineup.startingPlayers]), bench: Object.freeze([...team.lineup.bench]),
      positions: Object.freeze(team.lineup.positions.map(slot => Object.freeze({ ...slot }))) }) })
}

/** Projeção exclusiva do editor; nunca entregue ao avanço de calendário ou ao motor pela UI. */
export function previewTeamSetup(session: PrototypeSession, setup?: TeamSetup): PrototypeSession {
  if (!setup) return session
  if (setup.clubId !== session.game.humanClubId) throw new Error('Rascunho pertence a outro clube.')
  return Object.freeze({ ...session, starterSlots: setup.starterSlots,
    teams: Object.freeze(session.teams.map(team => team.club.id === setup.clubId ? Object.freeze({ ...team, lineup: setup.lineup, tactics: setup.tactics }) : team)) })
}

export function hasTeamSetupChanges(session: PrototypeSession, draft?: TeamSetup): boolean {
  return !!draft && JSON.stringify(captureTeamSetup(session)) !== JSON.stringify(draft)
}

export type TeamSetupCommit = { readonly ok: true; readonly session: PrototypeSession; readonly validation: TeamSelectionValidation }
  | { readonly ok: false; readonly validation: TeamSelectionValidation }

/** Valida antes do único commit; erros não entregam sessão parcialmente atualizada. */
export function commitTeamSetup(session: PrototypeSession, draft: TeamSetup): TeamSetupCommit {
  if (session.liveMatch) throw new Error('Use os controles táticos da partida em andamento.')
  if (session.pendingMatch) throw new Error('Continue o resultado antes de salvar a equipe.')
  if (session.game.competitions[0].league.season.status === 'FINISHED') throw new Error('Esta temporada já terminou.')
  const projected = previewTeamSetup(session, draft)
  const team = humanTeam(projected)
  const validation = validateTeamSelection(team.lineup, team.tactics, humanTeam(session))
  if (!validation.valid) return { ok: false, validation }
  const lineup = createLineup(team.lineup)
  const tactics = createTactics(team.tactics)
  // Em um commit válido, os slots podem ser derivados das associações confirmadas.
  const committed = Object.freeze({ ...session, starterSlots: undefined,
    teams: Object.freeze(session.teams.map(current => current.club.id === draft.clubId ? Object.freeze({ ...current, lineup, tactics }) : current)) })
  return { ok: true, session: committed, validation }
}
