import { useRef } from 'react'
import { FORMATIONS, FORMATION_POSITIONS, MENTALITIES, STYLES } from '../../domain/tactics'
import type { Formation, Tactics } from '../../domain/tactics'
import { mentalityLabels, styleLabels } from './presentation'
import { PITCH_LAYOUTS } from './pitchLayout'

function FormationDiagram({ formation }: { formation: Formation }) {
  return <svg className="formation-diagram" viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="4" /><path d="M4 50H96M30 4V20H70V4M30 96V80H70V96" /><circle className="center-circle" cx="50" cy="50" r="10" />{PITCH_LAYOUTS[formation].map(([x, y], index) => <circle key={index} className={FORMATION_POSITIONS[formation][index] === 'GK' ? 'keeper-dot' : 'player-dot'} cx={x} cy={y} r="3.4" />)}</svg>
}

function FormationPicker({ tactics, locked, onChange }: { tactics: Tactics; locked: boolean; onChange: (tactics: Tactics) => void }) {
  const details = useRef<HTMLDetailsElement>(null)
  return <div className="formation-control"><span className="control-label">Formação</span><details className="formation-picker" ref={details}><summary><FormationDiagram formation={tactics.formation} /><span><strong>{tactics.formation}</strong><small>Ver {FORMATIONS.length} formações</small></span><span aria-hidden="true">⌄</span></summary><div className="formation-grid" aria-label="Catálogo de formações">{FORMATIONS.map(formation => <button className="formation-card" disabled={locked} key={formation} aria-pressed={tactics.formation === formation} aria-label={`Formação ${formation}`} onClick={() => { onChange({ ...tactics, formation }); if (details.current) { details.current.open = false; details.current.querySelector('summary')?.focus() } }}><FormationDiagram formation={formation} /><strong>{formation}</strong></button>)}</div></details><small>Reorganiza os mesmos titulares; confira eventuais improvisações.</small></div>
}

export function TacticsControls({ tactics, locked, onChange }: { tactics: Tactics; locked: boolean; onChange: (tactics: Tactics) => void }) {
  return <section className="panel tactics-console"><FormationPicker tactics={tactics} locked={locked} onChange={onChange} />
    <fieldset disabled={locked}><legend>Mentalidade</legend><div className="segmented-control">{MENTALITIES.map(mentality => <button key={mentality} aria-pressed={tactics.mentality === mentality} onClick={() => onChange({ ...tactics, mentality })}>{mentalityLabels[mentality]}</button>)}</div><small>Defensiva prioriza defesa; ofensiva troca proteção por ataque.</small></fieldset>
    <fieldset disabled={locked}><legend>Estilo</legend><div className="style-control">{STYLES.map(style => <button key={style} aria-pressed={tactics.style === style} onClick={() => onChange({ ...tactics, style })}>{styleLabels[style]}</button>)}</div><small>Posse, contra-ataque e pressão alteram setores diferentes, sem bônus universal.</small></fieldset>
  </section>
}
