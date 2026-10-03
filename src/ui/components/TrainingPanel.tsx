import type { PrototypeSession } from '../../application/prototypeSession'
import { humanTeam } from '../../application/prototypeSession'
import { latestTrainingCycle, setTrainingFocus, trainingFocus } from '../../application/playerDevelopment'
import type { TrainingFocus } from '../../domain/players/development'
import { attributeLabels, dateLabel } from './presentation'

const focusLabels: Readonly<Record<TrainingFocus, string>> = {
  BALANCED: 'Equilibrado', PHYSICAL: 'Físico', TECHNICAL: 'Técnico',
  OFFENSIVE: 'Ofensivo', DEFENSIVE: 'Defensivo', YOUTH: 'Jovens',
}
export function TrainingPanel({ session, onAction }: { session: PrototypeSession; onAction: (operation: () => PrototypeSession) => boolean }) {
  const team = humanTeam(session)
  const focus = trainingFocus(session, team.club.id)
  const last = latestTrainingCycle(session, team.club.id)
  const players = new Map(team.players.map(player => [player.id, player.displayName]))
  const changes = last?.changes.filter(change => change.clubId === team.club.id) ?? []
  const busy = !!session.liveMatch || !!session.pendingMatch || session.game.competitions[0].league.season.status === 'FINISHED'
  return <section className="panel training-panel" aria-labelledby="training-heading">
    <div><span className="eyebrow">Desenvolvimento do elenco</span><h2 id="training-heading">Treinamento mensal</h2><p className="muted">O Centro de Treinamento aumenta gradualmente a chance de evolução. Atributos individuais avançam no máximo um ponto por ciclo.</p></div>
    <label>Foco do clube<select value={focus} disabled={busy} onChange={event => onAction(() => setTrainingFocus(session, team.club.id, event.target.value as TrainingFocus))}>{Object.entries(focusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <div className="training-cycle" aria-live="polite"><strong>{last ? `Último ciclo · ${dateLabel(last.date)}` : 'Próximo ciclo mensal'}</strong>
      {last ? changes.length ? <ul>{changes.slice(0, 6).map((change, index) => <li key={`${change.playerId}-${change.attribute}-${index}`}><span>{players.get(change.playerId) ?? 'Jogador'} · {attributeLabels[change.attribute]}</span><strong>{change.before} → {change.after}</strong></li>)}</ul> : <p className="muted">Sem alterações neste ciclo.</p> : <p className="muted">O treinamento é processado no primeiro dia de cada mês.</p>}
    </div>
  </section>
}
