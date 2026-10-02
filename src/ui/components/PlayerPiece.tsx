import type { Player, Position } from '../../domain/players'
import type { PointerEventHandler } from 'react'
import { positionFit, playerOverall } from '../../application/teamOverview'
import { positionLabel, statusLabels } from './presentation'
import { PlayerAvatar } from './PlayerAvatar'

const fitLabels = { natural: 'Posição natural', secondary: 'Posição secundária', improvised: 'Improvisado' }
/** Limite puramente visual, sem restringir elegibilidade ou aplicar desgaste. */
const LOW_FITNESS_DISPLAY = 70
export function PlayerPiece({ player, position, number, slot, compact = false, selected = false, moving = false, target = false, dragging = false, locked = false, onSelect, onPointerDown }: { player?: Player; position: Position; number?: number; slot?: number; compact?: boolean; selected?: boolean; moving?: boolean; target?: boolean; dragging?: boolean; locked?: boolean; onSelect: () => void; onPointerDown?: PointerEventHandler<HTMLButtonElement> }) {
  const fit = player ? positionFit(player, position) : 'natural'
  const unavailable = player && player.status !== 'AVAILABLE'
  const tired = player && player.fitness < LOW_FITNESS_DISPLAY
  const title = player ? `${player.displayName} · ${positionLabel(position)} · ${fitLabels[fit]} · Condição ${player.fitness}% · ${statusLabels[player.status]}${tired ? ' · Condição baixa (indicador visual)' : ''}` : `${positionLabel(position)} · Slot vazio`
  return <button type="button" data-team-slot={slot} data-player-id={player?.id} className={`player-piece ${compact ? 'compact' : ''} ${fit} ${unavailable ? 'unavailable' : ''} ${tired ? 'tired' : ''} ${selected ? 'selected-piece' : ''} ${moving ? 'moving-piece' : ''} ${target ? 'drop-target' : ''} ${dragging && slot !== undefined ? 'possible-target' : ''} ${locked ? 'locked-piece' : ''}`} title={title} aria-label={title} aria-pressed={selected} onClick={onSelect} onPointerDown={onPointerDown}>
    {compact && player ? <PlayerAvatar playerId={player.id} name={player.displayName} /> : <span className={`jersey ${position === 'GK' ? 'keeper' : ''}`} aria-hidden="true"><svg viewBox="0 0 80 70"><path d="M23 4 10 12 1 29 14 37 20 26 20 66 60 66 60 26 66 37 79 29 70 12 57 4 49 7 Q40 18 31 7Z"/><path className="jersey-seam" d="M31 7 Q40 18 49 7 M20 56H60"/></svg><b>{number ?? '—'}</b>{(unavailable || tired || fit === 'improvised' || fit === 'secondary') && <i className="piece-indicator">{unavailable ? '×' : tired ? '↓' : fit === 'improvised' ? '!' : '·'}</i>}</span>}
    <span className="piece-name">{player?.displayName ?? 'Escolher jogador'}</span><span className="piece-meta">{positionLabel(position, true)}{compact && player ? ` · OVR ${playerOverall(player)} · ${player.fitness}%` : ''}</span>
    {compact && player && <small>Forma {player.form}</small>}
    {!compact && player && <span className="fitness-line" aria-hidden="true"><span style={{ width: `${player.fitness}%` }} /></span>}
  </button>
}
