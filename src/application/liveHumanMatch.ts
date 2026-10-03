import { registerMatchInjuries } from './injuryLifecycle'
import { lockMatchAdmission } from './stadiumManagement'
import { createLineup } from '../domain/tactics'
import type { Tactics } from '../domain/tactics'
import type { MatchSession, MatchSnapshot } from '../simulation'
import { startHumanMatchSession } from './temporalGame'
import { humanTeam, prototypeMatchDependencies, prototypeView, selectionValidation } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'
import { captureTeamSetup, previewTeamSetup } from './teamSetup'
import type { TeamSetup } from './teamSetup'

// O controlador mutável não integra o read model recebido pelo React.
// Snapshots antigos não podem executar comandos sobre um estado mais recente.
const engines = new WeakMap<MatchSnapshot, MatchSession>()

function publish(session: PrototypeSession, engine: MatchSession): PrototypeSession {
  const snapshot = engine.snapshot()
  session = registerMatchInjuries(session, snapshot.matchId, snapshot.events, session.game.calendar.currentDate)
  if (session.liveMatch) engines.delete(session.liveMatch)
  if (snapshot.phase === 'FULL_TIME') {
    return Object.freeze({ ...session, liveMatch: undefined,
      pendingMatch: Object.freeze({ matchId: snapshot.matchId, result: engine.toResult() }),
    })
  }
  engines.set(snapshot, engine)
  return Object.freeze({ ...session, liveMatch: snapshot })
}

function activeEngine(session: PrototypeSession): MatchSession {
  const engine = session.liveMatch && engines.get(session.liveMatch)
  if (!engine) throw new Error('Não há sessão ativa para este snapshot da partida.')
  return engine
}

export function startPrototypeLiveMatch(session: PrototypeSession): PrototypeSession {
  if (session.liveMatch || session.pendingMatch) return session
  const validation = selectionValidation(session)
  if (!validation.valid) throw new Error(`Corrija a escalação: ${validation.errors.map(error => error.message).join(' ')}`)
  const matchId = prototypeView(session).pendingActions[0]?.matchId
  if (!matchId) throw new Error('Avance o calendário até sua próxima partida.')
  return publish(lockMatchAdmission(session, matchId), startHumanMatchSession(session.game, matchId, prototypeMatchDependencies(session)))
}

export function advancePrototypeLiveMatch(session: PrototypeSession, minutes: number): PrototypeSession {
  const engine = activeEngine(session)
  engine.advance(minutes)
  return publish(session, engine)
}

export function advancePrototypeToNextMatchEvent(session: PrototypeSession): PrototypeSession {
  const engine = activeEngine(session)
  while (engine.snapshot().canAdvance) {
    if (engine.advance(1).newEvents.length) break
  }
  return publish(session, engine)
}

export function startPrototypeSecondHalf(session: PrototypeSession): PrototypeSession {
  const engine = activeEngine(session)
  engine.startSecondHalf()
  return publish(session, engine)
}

export function updatePrototypeLiveTactics(session: PrototypeSession, tactics: Tactics): PrototypeSession {
  const engine = activeEngine(session)
  if (!session.game.humanClubId) throw new Error('Sessão sem clube humano.')
  engine.applyTactics(session.game.humanClubId, tactics)
  return publish(session, engine)
}

/** Somente projeção editável. Não deve ser entregue ao motor/calendário. */
export function liveTeamEditorSession(session: PrototypeSession, draft?: TeamSetup): PrototypeSession {
  const snapshot = session.liveMatch
  if (!snapshot) throw new Error('Partida sem sessão ativa.')
  const home = snapshot.homeClubId === session.game.humanClubId
  const team = humanTeam(session)
  const projected = Object.freeze({ ...session, liveMatch: undefined, starterSlots: undefined,
    teams: Object.freeze(session.teams.map(current => current.club.id === team.club.id ? Object.freeze({ ...current,
      lineup: home ? snapshot.homeLineup : snapshot.awayLineup,
      tactics: home ? snapshot.homeTactics : snapshot.awayTactics,
    }) : current)),
  })
  return previewTeamSetup(projected, draft)
}

export function captureLiveTeamSetup(session: PrototypeSession): TeamSetup {
  return captureTeamSetup(liveTeamEditorSession(session))
}

export function commitPrototypeLiveTeamSetup(session: PrototypeSession, draft: TeamSetup): PrototypeSession {
  const engine = activeEngine(session)
  if (draft.clubId !== session.game.humanClubId) throw new Error('Alterações pertencem a outro clube.')
  const snapshot = session.liveMatch!
  const current = snapshot.homeClubId === draft.clubId ? snapshot.homeLineup : snapshot.awayLineup
  // O editor pré-jogo devolve o titular ao banco para permitir desfazer no rascunho.
  // Na partida confirmada ele sai definitivamente e não integra o banco disponível.
  const lineup = createLineup({ ...draft.lineup, bench: current.bench.filter(id => !draft.lineup.startingPlayers.includes(id)) })
  engine.applyTeamSelection(draft.clubId, lineup, draft.tactics)
  return publish(session, engine)
}

export function advancePrototypeToHalfTime(session: PrototypeSession): PrototypeSession {
  const engine = activeEngine(session)
  if (session.liveMatch!.phase !== 'PRE_MATCH' && session.liveMatch!.phase !== 'FIRST_HALF') return session
  engine.advance(Number.MAX_SAFE_INTEGER)
  return publish(session, engine)
}

/** Atalhos de fim/rápido compartilham a mesma sessão e respeitam suas permissões. */
export function finishPrototypeLiveMatch(session: PrototypeSession): PrototypeSession {
  if (session.pendingMatch) return session
  const engine = activeEngine(session)
  while (engine.snapshot().phase !== 'FULL_TIME') {
    const snapshot = engine.snapshot()
    if (snapshot.phase === 'HALF_TIME' && snapshot.canStartSecondHalf) engine.startSecondHalf()
    else if (snapshot.canAdvance) engine.advance(Number.MAX_SAFE_INTEGER)
    else break // Futuras pendências obrigatórias devem bloquear estas permissões.
  }
  return publish(session, engine)
}
