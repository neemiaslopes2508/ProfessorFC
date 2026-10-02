import { useEffect, useRef } from 'react'

export function LeaveTeamDialog({ error, onSave, onDiscard, onCancel }: { error?: string; onSave: () => void; onDiscard: () => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current!
    element.showModal()
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])
  return <dialog className="leave-team-dialog" ref={dialog} aria-labelledby="leave-team-title" aria-describedby="leave-team-description" onCancel={event => { event.preventDefault(); onCancel() }}>
    <span className="eyebrow">Confirme sua equipe</span><h2 id="leave-team-title">Alterações não salvas</h2><p id="leave-team-description">Você possui alterações não salvas na equipe. Salve para usá-las na próxima partida ou descarte para manter a equipe confirmada.</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="actions"><button autoFocus onClick={onCancel}>CANCELAR</button><button onClick={onDiscard}>DESCARTAR</button><button className="primary" onClick={onSave}>SALVAR</button></div>
  </dialog>
}
