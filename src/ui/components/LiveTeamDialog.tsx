import { useEffect, useRef, useState } from 'react'
import { captureLiveTeamSetup, liveTeamEditorSession } from '../../application/liveHumanMatch'
import { humanTeam, moveTeamPlayer, setPrototypeTactics } from '../../application/prototypeSession'
import type { PrototypeSession } from '../../application/prototypeSession'
import { captureTeamSetup } from '../../application/teamSetup'
import type { TeamSetup } from '../../application/teamSetup'
import { TeamPage } from '../pages/TeamPage'
import { readableSelectionMessage } from './presentation'

export function LiveTeamDialog({ session, initialTab, error, onConfirm, onCancel }: {
  session: PrototypeSession; initialTab: 'lineup' | 'tactics'; error?: string;
  onConfirm: (draft: TeamSetup) => PrototypeSession | undefined; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => captureLiveTeamSetup(session))
  const [localError, setLocalError] = useState<string>()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current!
    element.showModal()
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])
  const editing = liveTeamEditorSession(session, draft)
  const snapshot = session.liveMatch!
  const home = snapshot.homeClubId === session.game.humanClubId
  const substitutions = home ? snapshot.homeSubstitutions : snapshot.awaySubstitutions
  const current = home ? snapshot.homeLineup : snapshot.awayLineup
  const planned = current.startingPlayers.filter(id => !draft.lineup.startingPlayers.includes(id)).length
  function edit(action: (current: PrototypeSession) => PrototypeSession): boolean {
    try { setDraft(captureTeamSetup(action(editing))); setLocalError(undefined); return true }
    catch (cause) { setLocalError(readableSelectionMessage(cause instanceof Error ? cause.message : 'Alteração inválida.')); return false }
  }
  return <dialog className="live-team-dialog" ref={dialog} aria-labelledby="live-team-title" onCancel={event => { event.preventDefault(); onCancel() }}>
    <header className="section-heading"><div><span className="eyebrow">Partida pausada · {snapshot.currentMinute}′</span><h2 id="live-team-title">Alterações ao vivo</h2></div><button autoFocus onClick={onCancel}>CANCELAR</button></header>
    <p className="muted">{humanTeam(editing).club.name} · {substitutions.used}/{substitutions.limit} substituições feitas · {planned} no rascunho. Aplique o conjunto ou cancele para manter a configuração atual.</p>
    {(localError || error) && <p className="notice error" role="alert">{localError || error}</p>}
    <TeamPage session={editing} live initialTab={initialTab} onMove={(id, slot) => edit(current => moveTeamPlayer(current, id, slot))} onTactics={tactics => edit(current => setPrototypeTactics(current, tactics))} onBench={() => {}} />
    <footer className="live-team-confirm"><p className="muted">Só Confirmar altera a partida. Titulares que saírem definitivamente não poderão retornar.</p><div className="actions"><button onClick={onCancel}>CANCELAR</button><button className="primary" onClick={() => { if (onConfirm(draft)) onCancel() }}>CONFIRMAR ALTERAÇÕES</button></div></footer>
  </dialog>
}
